import { expect, test } from '@playwright/test';

test('install offer is user-triggered, dismissible and remains available in Settings', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'installCalls', { value: 0, writable: true });
  });
  await page.goto('/nibblepot/');
  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true });
    Object.assign(event, {
      prompt: async () => { (window as unknown as { installCalls: number }).installCalls++; },
      userChoice: Promise.resolve({ outcome: 'dismissed' }),
    });
    window.dispatchEvent(event);
  });
  await expect(page.getByRole('button', { name: 'Install Simmer', exact: true })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { installCalls: number }).installCalls)).toBe(0);
  await page.getByRole('button', { name: 'Maybe later' }).click();
  await expect(page.getByRole('region', { name: 'Install Simmer' })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('region', { name: 'Install Simmer' })).toHaveCount(0);
  await page.goto('/nibblepot/settings/');
  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true });
    Object.assign(event, { prompt: async () => { (window as unknown as { installCalls: number }).installCalls++; }, userChoice: Promise.resolve({ outcome: 'accepted' }) });
    window.dispatchEvent(event);
  });
  await page.getByRole('button', { name: 'Install Simmer', exact: true }).click();
  expect(await page.evaluate(() => (window as unknown as { installCalls: number }).installCalls)).toBe(1);
  await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')));
  await expect(page.getByText('Simmer is on your home screen')).toBeVisible();
});

test('iPhone visitors get manual instructions and installed apps hide the offer', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'userAgent', { value: 'iPhone' });
  });
  await page.goto('/nibblepot/');
  await page.getByRole('button', { name: 'How to install', exact: true }).click();
  await expect(page.getByText('Add to Home Screen', { exact: true })).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')));
  await expect(page.getByRole('region', { name: 'Install Simmer' })).toHaveCount(0);
});

test('recipes, images, deep links and saved lists survive going offline', async ({ page, context }) => {
  await page.goto('/nibblepot/');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  // A full navigation also verifies that an existing installation takes control.
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await page.evaluate(() => {
    localStorage.setItem('nibblepot-demo-v1', JSON.stringify({ favorites: ['jacket'], larder: ['beans'], shopping: [] }));
  });
  await context.setOffline(true);
  await page.goto('/nibblepot/recipes/jacket/');
  await expect(page.getByRole('heading', { name: 'Jacket potatoes & beans', exact: true })).toBeVisible();
  await expect(page.getByText('You’re offline.', { exact: false })).toBeVisible();
  expect(await page.evaluate(async () => (await fetch('/nibblepot/recipes/jacket.webp')).ok)).toBe(true);
  await page.goto('/nibblepot/favourites/');
  await expect(page.getByRole('heading', { name: 'Jacket potatoes & beans', exact: true })).toBeVisible();
  await page.goto('/nibblepot/settings/');
  await expect(page.getByText('Ready for offline tea times.', { exact: true })).toBeVisible();
  await context.setOffline(false);
  await expect(page.getByText('You’re offline.', { exact: false })).toHaveCount(0);
});

test('manifest shortcuts and icons stay inside the GitHub Pages scope', async ({ request }) => {
  const manifest = await (await request.get('/nibblepot/manifest.webmanifest')).json();
  expect(manifest.id).toBe('/nibblepot/');
  expect(manifest.display).toBe('standalone');
  expect(manifest.name).toBe('Simmer');
  expect(manifest.icons.map((icon: {purpose:string})=>icon.purpose)).toEqual(['any','any','maskable']);
  expect(manifest.shortcuts.map((shortcut: { url: string }) => shortcut.url)).toEqual(['planner/', 'shopping/', 'favourites/']);
  for (const icon of manifest.icons) {
    const response=await request.get(`/nibblepot/${icon.src}`);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('image/png');
    expect((await response.body()).subarray(0,8).toString('hex')).toBe('89504e470d0a1a0a');
  }
});


test('install artwork decodes in the page and Apple touch icon has a PNG response', async ({page,request})=>{
  await page.goto('/nibblepot/settings/');
  const artwork=page.getByRole('region',{name:'Install Simmer'}).locator('img');
  await expect(artwork).toBeVisible();
  await expect(artwork).toHaveAttribute('src','/nibblepot/icons/icon-192-v2.png');
  expect(await artwork.evaluate((image:HTMLImageElement)=>image.complete && image.naturalWidth===192)).toBe(true);
  const touch=await page.locator('link[rel=apple-touch-icon]').getAttribute('href');
  expect(touch).toBe('/nibblepot/icons/apple-touch-180-v2.png');
  const response=await request.get(touch!);
  expect(response.headers()['content-type']).toContain('image/png');
});

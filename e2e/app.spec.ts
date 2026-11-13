import { test, expect, type Page } from '@playwright/test';

async function openSecondaryTab(page: Page, project: string, tab: 'Favourites' | 'Settings') {
  if (project === 'mobile') {
    await page.getByRole('navigation', {name:'Mobile navigation'}).getByRole('button', {name:'More'}).click();
    await page.getByRole('dialog', {name:'More Simmer'}).getByRole('button', {name:tab}).click();
  } else {
    await page.getByRole('navigation', {name:'Main navigation'}).getByRole('button', {name:tab}).click();
  }
}

test('random dinner and recipe flow', async ({ page }, testInfo) => {
  await page.goto('/nibblepot/');
  // Ensure the random recipe has missing ingredients regardless of which meal is selected.
  await page.evaluate(() => localStorage.setItem('simmer-recipes-v2', JSON.stringify({
    larder: [], favorites: [], shopping: [],
  })));
  await page.reload();

  await expect(page.getByRole('region', { name: "Tonight's inspiration" })).toBeVisible();
  await expect(page.locator('.recipe-card')).toHaveCount(45);
  await page.getByRole('region', { name: "Tonight's inspiration" }).getByRole('button', { name: /surprise me/i }).click();
  await page.getByRole('region', { name: "Tonight's inspiration" }).getByRole('button', { name: /view recipe/i }).click();
  await expect(page).toHaveURL(/\/nibblepot\/recipes\/[a-z0-9-]+\//);
  await expect(page.locator('.recipe-page')).toBeVisible();
  await expect(page.getByRole('heading', { name: /What you'll need/i })).toBeVisible();
  await page.getByRole('button', { name: /add missing bits/i }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('navigation', { name: testInfo.project.name === 'mobile' ? 'Mobile navigation' : 'Main navigation' }).getByRole('button', { name: 'Shopping' }).click();
  await expect(page.locator('.shop-row').first()).toBeVisible();
  await expect(page.locator('.tesco-link').first()).toHaveAttribute('href', /^https:\/\/www\.tesco\.com\/shop\/en-GB\/search\?query=/);
});

test('favourites and larder persist after reload', async ({ page }, testInfo) => {
  await page.goto('/nibblepot/');
  await page.locator('.recipe-card').first().getByRole('button', { name: /add to favourites/i }).click();
  await openSecondaryTab(page, testInfo.project.name, 'Favourites');
  await expect(page.locator('.recipe-card')).toHaveCount(1);
  await page.reload();
  await openSecondaryTab(page, testInfo.project.name, 'Favourites');
  await expect(page.locator('.recipe-card')).toHaveCount(1);
  const nav = testInfo.project.name === 'mobile' ? 'Mobile navigation' : 'Main navigation';
  await page.getByRole('navigation', { name: nav }).getByRole('button', { name: 'Larder' }).click();
  const potatoes = page.locator('.larder-item').filter({ hasText: 'Potatoes' }).getByRole('checkbox');
  await potatoes.uncheck();
  await page.reload();
  await page.getByRole('navigation', { name: nav }).getByRole('button', { name: 'Larder' }).click();
  await expect(page.locator('.larder-item').filter({ hasText: 'Potatoes' }).getByRole('checkbox')).not.toBeChecked();
});

test('spotlight changes recipe and keeps keyboard focus on Surprise me', async ({ page }) => {
  const backdropResponse = page.waitForResponse(response => /\/nibblepot\/backgrounds\/[^/]+\.webp$/.test(response.url()));
  await page.goto('/nibblepot/');
  const spotlight = page.getByRole('region', { name: "Tonight's inspiration" });
  await expect(spotlight.locator('.simmer-spotlight-image')).toHaveCSS('background-image', /\/nibblepot\/backgrounds\/[^/]+\.webp/);
  expect((await backdropResponse).ok()).toBe(true);
  const shuffle = spotlight.getByRole('button', { name: /surprise me/i });
  const title = spotlight.getByRole('heading', { level: 1 });
  await expect(title).toBeVisible();
  const originalTitle = await title.innerText();
  await expect(spotlight.getByRole('button')).toHaveCount(2);
  await shuffle.focus();
  await shuffle.press('Enter');
  await expect(title).not.toHaveText(originalTitle);
  await expect(shuffle).toBeFocused();
  const shuffledTitle = await title.innerText();
  await page.reload();
  await expect(title).toHaveText(shuffledTitle);
});

test('opening a recipe navigates to its own page and Back returns to listing', async ({ page }) => {
  await page.goto('/nibblepot/');
  const link = page.locator('.recipe-card').first().getByRole('link', { name: /jacket potatoes/i });
  await expect(link).toHaveAttribute('href', '/nibblepot/recipes/jacket-potatoes-and-beans/');
  await link.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/nibblepot\/recipes\/jacket\/$/);
  await expect(page.locator('.recipe-page h1')).toHaveText('Jacket potatoes & beans');
  await page.getByRole('button', { name: /back to recipes/i }).click();
  await expect(page).toHaveURL(/\/nibblepot\/$/);
  await expect(page.locator('.recipe-card')).toHaveCount(45);
  await expect(link).toBeFocused();
});

test('mobile recipe card opens from the image, description and larder status', async ({ page, isMobile }) => {
  test.skip(!isMobile);
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/nibblepot/');
  const card = page.locator('.recipe-card').first();
  await expect(card.getByRole('link')).toHaveCount(1);
  const favourite = card.getByRole('button', { name: /add to favourites/i });
  await expect(favourite).toHaveCSS('width', '44px');
  await favourite.tap();
  await expect(card.getByRole('button', { name: /remove from favourites/i })).toHaveAttribute('aria-pressed', 'true');
  await expect(page).toHaveURL(/\/nibblepot\/$/);

  for (const area of ['.recipe-illustration', '.recipe-info p', '.foot-meta']) {
    const target = card.locator(area);
    await target.scrollIntoViewIfNeeded();
    const bounds = (await target.boundingBox())!;
    await page.touchscreen.tap(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await expect(page).toHaveURL(/\/nibblepot\/recipes\/jacket\/$/);
    await page.getByRole('button', { name: /back to recipes/i }).click();
    await expect(page).toHaveURL(/\/nibblepot\/$/);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
});

test('settings backup, restore, and confirmed reset persist across reloads', async ({ page }, testInfo) => {
  await page.goto('/nibblepot/');
  await page.locator('.recipe-card').first().getByRole('button', { name: /add to favourites/i }).click();
  await openSecondaryTab(page, testInfo.project.name, 'Settings');
  await expect(page.getByRole('heading', { name: /little tweaks/i })).toBeVisible();
  await expect(page.locator('.settings-stats')).toContainText('1');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export' }).click();
  const download = await downloadPromise;
  const { readFile } = await import('node:fs/promises');
  const content = await readFile(await download.path(), 'utf8');
  expect(JSON.parse(content).data.favorites.length).toBe(1);

  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Clear saved data' }).click();
  await expect(page.locator('.settings-stats')).toContainText('0');
  await page.reload();
  await openSecondaryTab(page, testInfo.project.name, 'Settings');
  await expect(page.locator('.settings-stats')).toContainText('0');

  page.once('dialog', dialog => dialog.accept());
  await page.locator('input[type="file"]').setInputFiles({ name: 'nibblepot-backup.json', mimeType: 'application/json', buffer: Buffer.from(content) });
  await expect(page.locator('.settings-stats')).toContainText('1');
});

test('refresh app reloads the full PWA without clearing saved favourites', async ({ page }, testInfo) => {
  await page.goto('/nibblepot/');
  await page.locator('.recipe-card').first().getByRole('button', { name: /add to favourites/i }).click();
  await openSecondaryTab(page, testInfo.project.name, 'Settings');
  await page.evaluate(() => sessionStorage.setItem('before-refresh', 'yes'));
  const navigation = page.waitForEvent('load');
  await page.getByRole('button', { name: 'Refresh app' }).click();
  await navigation;
  await expect(page.getByRole('heading', { name: /little tweaks/i })).toBeVisible();
  await expect(page).toHaveURL(/\/nibblepot\/settings\/$/);
  expect(await page.evaluate(() => sessionStorage.getItem('before-refresh'))).toBe('yes');
  await openSecondaryTab(page, testInfo.project.name, 'Favourites');
  await expect(page.locator('.recipe-card')).toHaveCount(1);
});

test('pull-to-refresh is available on mobile and reloads instead of rerendering', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Touch gesture is designed for touch devices');
  await page.goto('/nibblepot/');
  await page.evaluate(() => sessionStorage.setItem('touch-started', 'yes'));
  const loaded = page.waitForEvent('load');
  await page.evaluate(() => {
    const target = document.querySelector('.section-heading')!;
    const create = (x: number, y: number) => new Touch({ identifier: 1, target, clientX: x, clientY: y });
    document.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true, touches: [create(140, 80)] }));
    document.dispatchEvent(new TouchEvent('touchmove', { bubbles: true, cancelable: true, touches: [create(140, 270)] }));
    document.dispatchEvent(new TouchEvent('touchend', { bubbles: true, cancelable: true, touches: [], changedTouches: [create(140, 270)] }));
  });
  await loaded;
  expect(await page.evaluate(() => sessionStorage.getItem('touch-started'))).toBe('yes');
  await expect(page.locator('.recipe-card')).toHaveCount(45);
});

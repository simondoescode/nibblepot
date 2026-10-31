import { test, expect } from '@playwright/test';

test('random dinner and recipe flow', async ({ page }, testInfo) => {
  await page.goto('/nibblepot/');
  await expect(page.getByRole('heading', { name: /what's for/i })).toBeVisible();
  await expect(page.locator('.recipe-card')).toHaveCount(16);
  await page.getByRole('button', { name: '🎲 Surprise me!' }).click();
  await expect(page.getByRole('dialog', { name: /random dinner suggestion/i })).toBeVisible();
  await page.getByRole('button', { name: /see recipe/i }).click();
  await expect(page).toHaveURL(/\/nibblepot\/recipes\/[a-z0-9-]+\//);
  await expect(page.locator('.recipe-page')).toBeVisible();
  await expect(page.getByRole('heading', { name: /What you'll need/i })).toBeVisible();
  await page.getByRole('button', { name: '🛒 Add missing bits' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('navigation', { name: testInfo.project.name === 'mobile' ? 'Mobile navigation' : 'Main navigation' }).getByRole('button', { name: 'Shopping' }).click();
  await expect(page.locator('.shop-row').first()).toBeVisible();
  await expect(page.locator('.tesco-link').first()).toHaveAttribute('href', /^https:\/\/www\.tesco\.com\/shop\/en-GB\/search\?query=/);
});

test('favourites and larder persist after reload', async ({ page }, testInfo) => {
  await page.goto('/nibblepot/');
  await page.locator('.recipe-card').first().getByRole('button', { name: /add to favourites/i }).click();
  if (testInfo.project.name === 'mobile') {
    await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('button', { name: 'Favourites' }).click();
  } else {
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'Favourites' }).click();
  }
  await expect(page.locator('.recipe-card')).toHaveCount(1);
  await page.reload();
  if (testInfo.project.name === 'mobile') {
    await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('button', { name: 'Favourites' }).click();
  } else {
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'Favourites' }).click();
  }
  await expect(page.locator('.recipe-card')).toHaveCount(1);
  const nav = testInfo.project.name === 'mobile' ? 'Mobile navigation' : 'Main navigation';
  await page.getByRole('navigation', { name: nav }).getByRole('button', { name: 'Larder' }).click();
  const potatoes = page.locator('.larder-item').filter({ hasText: 'Potatoes' }).getByRole('checkbox');
  await potatoes.uncheck();
  await page.reload();
  await page.getByRole('navigation', { name: nav }).getByRole('button', { name: 'Larder' }).click();
  await expect(page.locator('.larder-item').filter({ hasText: 'Potatoes' }).getByRole('checkbox')).not.toBeChecked();
});

test('recipe dialog traps focus and closes on Escape, returning to opener', async ({ page }) => {
  await page.goto('/nibblepot/');
  const open = page.getByRole('button', { name: '🎲 Surprise me!' });
  await open.focus();
  await open.click();
  const dialog = page.getByRole('dialog', { name: /random dinner suggestion/i });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Close dialog' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog).toContainText('Tonight');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(open).toBeFocused();
});

test('opening a recipe navigates to its own page and Back returns to listing', async ({ page }) => {
  await page.goto('/nibblepot/');
  const link = page.locator('.recipe-card').first().getByRole('link', { name: /view jacket/i });
  await expect(link).toHaveAttribute('href', '/nibblepot/recipes/jacket/');
  await link.click();
  await expect(page).toHaveURL(/\/nibblepot\/recipes\/jacket\/$/);
  await expect(page.locator('.recipe-page h1')).toHaveText('Jacket potatoes & beans');
  await page.getByRole('button', { name: /back to recipes/i }).click();
  await expect(page).toHaveURL(/\/nibblepot\/$/);
  await expect(page.locator('.recipe-card')).toHaveCount(16);
});

test('settings backup, restore, and confirmed reset persist across reloads', async ({ page }, testInfo) => {
  await page.goto('/nibblepot/');
  const nav = page.getByRole('navigation', { name: testInfo.project.name === 'mobile' ? 'Mobile navigation' : 'Main navigation' });
  await page.locator('.recipe-card').first().getByRole('button', { name: /add to favourites/i }).click();
  await nav.getByRole('button', { name: 'Settings' }).click();
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
  await page.getByRole('navigation', { name: testInfo.project.name === 'mobile' ? 'Mobile navigation' : 'Main navigation' }).getByRole('button', { name: 'Settings' }).click();
  await expect(page.locator('.settings-stats')).toContainText('0');

  page.once('dialog', dialog => dialog.accept());
  await page.locator('input[type="file"]').setInputFiles({ name: 'nibblepot-backup.json', mimeType: 'application/json', buffer: Buffer.from(content) });
  await expect(page.locator('.settings-stats')).toContainText('1');
});

test('refresh app reloads the full PWA without clearing saved favourites', async ({ page }, testInfo) => {
  await page.goto('/nibblepot/');
  await page.locator('.recipe-card').first().getByRole('button', { name: /add to favourites/i }).click();
  const navName = testInfo.project.name === 'mobile' ? 'Mobile navigation' : 'Main navigation';
  await page.getByRole('navigation', { name: navName }).getByRole('button', { name: 'Settings' }).click();
  await page.evaluate(() => sessionStorage.setItem('before-refresh', 'yes'));
  const navigation = page.waitForEvent('load');
  await page.getByRole('button', { name: 'Refresh app' }).click();
  await navigation;
  await expect(page.getByRole('heading', { name: /what's for/i })).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem('before-refresh'))).toBe('yes');
  await page.getByRole('navigation', { name: navName }).getByRole('button', { name: 'Favourites' }).click();
  await expect(page.locator('.recipe-card')).toHaveCount(1);
});

test('pull-to-refresh is available on mobile and reloads instead of rerendering', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Touch gesture is designed for touch devices');
  await page.goto('/nibblepot/');
  await page.evaluate(() => sessionStorage.setItem('touch-started', 'yes'));
  const loaded = page.waitForEvent('load');
  await page.evaluate(() => {
    const target = document.querySelector('.hero')!;
    const create = (x: number, y: number) => new Touch({ identifier: 1, target, clientX: x, clientY: y });
    document.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true, touches: [create(140, 80)] }));
    document.dispatchEvent(new TouchEvent('touchmove', { bubbles: true, cancelable: true, touches: [create(140, 270)] }));
    document.dispatchEvent(new TouchEvent('touchend', { bubbles: true, cancelable: true, touches: [], changedTouches: [create(140, 270)] }));
  });
  await loaded;
  expect(await page.evaluate(() => sessionStorage.getItem('touch-started'))).toBe('yes');
  await expect(page.locator('.recipe-card')).toHaveCount(16);
});

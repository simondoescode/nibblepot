import { test, expect, type Page } from '@playwright/test';

async function openSecondaryTab(page: Page, project: string, tab: 'Favourites' | 'Settings') {
  if (project === 'mobile') {
    const nav = page.getByRole('navigation', {name:'Mobile navigation'});
    if (tab === 'Settings') {
      await nav.getByRole('button', {name:'Recipes', exact:true}).click();
      await page.getByRole('button', {name:'Open settings', exact:true}).click();
    } else await nav.getByRole('button', {name:tab, exact:true}).click();
  } else {
    await page.getByRole('navigation', {name:'Main navigation'}).getByRole('button', {name:tab}).click();
  }
}

test('recipe discovery and shopping flow', async ({ page }, testInfo) => {
  await page.goto('/nibblepot/');
  // Ensure the random recipe has missing ingredients regardless of which meal is selected.
  await page.evaluate(() => localStorage.setItem('simmer-recipes-v2', JSON.stringify({
    larder: [], favorites: [], shopping: [],
  })));
  await page.reload();

  await expect(page.getByRole('region', { name: "Tonight's dinner" })).toBeVisible();
  await expect(page.locator('.recipe-card')).toHaveCount(61);
  await page.locator('.recipe-card').first().getByRole('link').click();
  await expect(page).toHaveURL(/\/nibblepot\/recipes\/[a-z0-9-]+\//);
  await expect(page.locator('.recipe-page')).toBeVisible();
  await expect(page.getByRole('heading', { name: /What you'll need/i })).toBeVisible();
  await page.getByRole('button', { name: /add missing ingredients/i }).click();
  await page.getByRole('button', { name: 'Back to recipes', exact: true }).click();
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
  const potatoes = page.getByRole('checkbox', { name: 'Potatoes', exact: true });
  await potatoes.uncheck();
  await page.reload();
  await page.getByRole('navigation', { name: nav }).getByRole('button', { name: 'Larder' }).click();
  await expect(page.getByRole('checkbox', { name: 'Potatoes', exact: true })).not.toBeChecked();
});

test('empty tonight picker returns keyboard focus when dismissed', async ({ page }) => {
  await page.goto('/nibblepot/');
  const trigger = page.getByRole('region', { name: "Tonight's dinner" }).getByRole('button', {name:'Plan tonight'});
  await trigger.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('opening a recipe navigates to its own page and Back returns to listing', async ({ page }) => {
  await page.goto('/nibblepot/');
  const link = page.locator('.recipe-card').first().getByRole('link', { name: /jacket potatoes/i });
  await expect(link).toHaveAttribute('href', '/nibblepot/recipes/jacket-potatoes-and-beans/');
  await link.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/nibblepot\/recipes\/jacket-potatoes-and-beans\/$/);
  await expect(page.locator('.recipe-page h1')).toHaveText('Jacket potatoes & beans');
  await page.getByRole('button', { name: /back to recipes/i }).click();
  await expect(page).toHaveURL(/\/nibblepot\/$/);
  await expect(page.locator('.recipe-card')).toHaveCount(61);
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

  for (const area of ['.recipe-illustration', '.recipe-info h3', '.foot-meta']) {
    const target = card.locator(area);
    await target.scrollIntoViewIfNeeded();
    const bounds = (await target.boundingBox())!;
    await page.touchscreen.tap(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await expect(page).toHaveURL(/\/nibblepot\/recipes\/jacket-potatoes-and-beans\/$/);
    await page.getByRole('button', { name: /back to recipes/i }).click();
    await expect(page).toHaveURL(/\/nibblepot\/$/);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
});

test('settings backup, restore, and confirmed reset persist across reloads', async ({ page }, testInfo) => {
  await page.goto('/nibblepot/');
  await page.locator('.recipe-card').first().getByRole('button', { name: /add to favourites/i }).click();
  await openSecondaryTab(page, testInfo.project.name, 'Settings');
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
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
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await expect(page).toHaveURL(/\/nibblepot\/settings\/$/);
  expect(await page.evaluate(() => sessionStorage.getItem('before-refresh'))).toBe('yes');
  await page.getByRole('button', {name: 'Back', exact: true}).click();
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
  await expect(page.locator('.recipe-card')).toHaveCount(61);
});

test('recipe menu adapts from a phone list to a two-column desktop grid', async ({ page }) => {
  await page.goto('/nibblepot/');
  const grid = page.locator('#home-results .menu-grid');
  for (const [width, columns] of [[390, 1], [1280, 2]]) {
    await page.setViewportSize({ width, height: 844 });
    await expect.poll(() => grid.evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(columns);
    const card = grid.locator('.recipe-card').first();
    await expect(card.getByRole('link')).toBeVisible();
    await expect(card.locator('.foot-meta')).toContainText('min');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  }
});

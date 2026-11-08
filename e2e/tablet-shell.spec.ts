import { test, expect } from '@playwright/test';

for (const width of [834, 1024, 1180]) {
  test(`tablet ${width}px uses the app navigation instead of desktop tabs`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/nibblepot/');
    const mobile = page.getByRole('navigation', { name: 'Mobile navigation' });
    await expect(mobile).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeHidden();
    await mobile.getByRole('button', { name: 'Larder' }).click();
    await expect(page).toHaveURL(/\/nibblepot\/larder\/$/);
    await mobile.getByRole('button', { name: 'More' }).click();
    await expect(page.getByRole('dialog', { name: 'More Simmer' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}

test('desktop navigation remains available above tablet widths', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/nibblepot/');
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeHidden();
});

test('the rebranded shell switches navigation at 1180px without changing app-bar height', async ({ page }) => {
  await page.setViewportSize({ width: 1180, height: 900 });
  await page.goto('/nibblepot/');
  const header = page.locator('.app-header-shell');
  await expect(header).toHaveCSS('position', 'sticky');
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible();
  await page.setViewportSize({ width: 1181, height: 900 });
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeHidden();
  await expect(header).toHaveCSS('height', '64px');
});

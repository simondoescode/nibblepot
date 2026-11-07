import { test, expect } from '@playwright/test';

const columns = (selector: string) => (page: import('@playwright/test').Page) => page.locator(selector).evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length);

for (const width of [768, 834, 1024, 1180]) {
  test(`tablet ${width}px keeps recipe detail, cooking, larder and planner side by side`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/nibblepot/recipes/tomato-pasta/');
    await expect(page.locator('.recipe-page-hero')).toBeVisible();
    expect(await columns('.recipe-page-hero')(page)).toBe(2);
    expect(await columns('.recipe-page-sections')(page)).toBe(2);
    await page.getByRole('button', { name: 'Start cooking' }).click();
    expect(await columns('.cook-layout')(page)).toBe(2);
    await expect(page.locator('.cook-side')).toBeVisible();
    await page.goto('/nibblepot/larder/');
    expect(await columns('.larder-layout')(page)).toBe(2);
    await expect(page.locator('.larder-aside')).toBeVisible();
    await page.goto('/nibblepot/planner/');
    expect(await columns('.planner-layout')(page)).toBe(2);
    await expect(page.locator('.planner-summary')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}

test('phone recipe and planner layouts remain single-column', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/nibblepot/recipes/tomato-pasta/');
  expect(await columns('.recipe-page-sections')(page)).toBe(1);
  await page.goto('/nibblepot/planner/');
  expect(await columns('.planner-layout')(page)).toBe(1);
});

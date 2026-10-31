
import { test, expect } from '@playwright/test';

const pageTitles = [
  {route: 'favourites', heading: 'Saved for later.'},
  {route: 'larder', heading: "What's in your larder?"},
  {route: 'planner', heading: "This week's tea."},
  {route: 'shopping', heading: 'Shopping, sorted.'},
  {route: 'settings', heading: 'Little tweaks.'},
] as const;

for (const { route, heading } of pageTitles) {
  test(`${route} has a text-only page title and one decorative header illustration`, async ({ page }) => {
    await page.goto(`/nibblepot/${route}/`);
    const header = page.locator('.page-intro');
    await expect(header.getByRole('heading', { level: 2 })).toHaveText(heading);
    await expect(header.locator('.intro-icon')).toHaveCount(1);
    await expect(header.locator('.intro-icon')).toHaveAttribute('aria-hidden', 'true');
    await expect(header.locator('h2 .intro-icon, h2 img, h2 svg')).toHaveCount(0);
  });
}

test('home section heading has no redundant decorative symbol', async ({ page }) => {
  await page.goto('/nibblepot/');
  await expect(page.locator('.section-heading h2')).toHaveText('What takes your fancy?');
  await expect(page.locator('.hero h1')).toHaveText(/What's for/);
});

test('missing recipe heading stays text only', async ({ page }) => {
  await page.goto('/nibblepot/recipes/not-a-recipe/');
  await expect(page.locator('.recipe-page-not-found h1')).toHaveText("That recipe's not in the pot");
});

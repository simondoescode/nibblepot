
import { test, expect } from '@playwright/test';

const pageTitles = [
  {route: 'favourites', heading: 'Saved for later.'},
  {route: 'larder', heading: "Your larder"},
  {route: 'planner', heading: "This week's dinners"},
  {route: 'shopping', heading: 'Shopping list'},
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
  await expect(page.getByRole('region',{name:"Tonight's dinner"}).getByRole('heading',{level:1})).toBeVisible();
});

test('missing recipe heading stays text only', async ({ page }) => {
  await page.goto('/nibblepot/recipes/not-a-recipe/');
  await expect(page.locator('.recipe-page-not-found h1')).toHaveText("That recipe's not in the pot");
});

test('Settings keeps its header visible and closes to Recipes on direct entry', async ({ page }) => {
  await page.goto('/nibblepot/settings/');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeInViewport();
  await expect(page.locator('footer, .mobile-nav')).toHaveCount(0);
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page).toHaveURL(/\/nibblepot\/$/);
});

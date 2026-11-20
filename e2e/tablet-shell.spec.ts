import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import type { Recipe } from '../src/types';

for (const width of [834, 1024, 1180]) {
  test(`tablet ${width}px uses the app navigation instead of desktop tabs`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/nibblepot/');
    const mobile = page.getByRole('navigation', { name: 'Mobile navigation' });
    await expect(mobile).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeHidden();
    await mobile.getByRole('button', { name: 'Larder' }).click();
    await expect(page).toHaveURL(/\/nibblepot\/larder\/$/);
    await expect(page.locator('.app-header-shell')).toBeHidden();
    await mobile.getByRole('button', { name: 'Favourites' }).click();
    await expect(page).toHaveURL(/\/favourites\/$/);
    await mobile.getByRole('button', { name: 'Recipes' }).click();
    await page.getByRole('button', { name: 'Open settings' }).click();
    await expect(page).toHaveURL(/\/settings\/$/);
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

const recipes: Recipe[] = JSON.parse(readFileSync(new URL('../src/data/recipes.json', import.meta.url), 'utf8'));
const longestRecipe = recipes.reduce((longest, recipe) => recipe.title.length > longest.title.length ? recipe : longest);

for (const width of [1280, 1440]) {
  test(`desktop Recipes keeps its main actions visible at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 720 });
    await page.addInitScript(id => sessionStorage.setItem('simmer-spotlight-v1', id), longestRecipe.id);
    await page.goto('/nibblepot/');
    await expect(page.getByRole('heading', { level: 1, name: longestRecipe.title, exact: true })).toBeVisible();
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    const activeTab = nav.getByRole('button', { name: 'Recipes', exact: true });
    await expect(activeTab).toHaveAttribute('aria-current', 'page');
    await expect(activeTab).toHaveCSS('color', 'rgb(21, 60, 50)');
    await activeTab.hover();
    await expect(activeTab).toHaveCSS('color', 'rgb(21, 60, 50)');
    await page.getByRole('button', { name: 'Simmer home' }).focus();
    await page.keyboard.press('Tab');
    await expect(activeTab).toBeFocused();
    await expect(activeTab).toHaveCSS('outline-style', 'solid');

    await page.evaluate(() => window.dispatchEvent(new Event('beforeinstallprompt', { cancelable: true })));
    const install = page.getByRole('region', { name: 'Install Simmer' });
    await expect(install.getByRole('button', { name: 'Install Simmer' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'View recipe', exact: true })).toBeInViewport();
    await expect(page.getByRole('button', { name: /Open planner/ })).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await install.getByRole('button', { name: 'Maybe later' }).click();
    await expect(install).toHaveCount(0);
  });
}

import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
const recipes = JSON.parse(readFileSync('src/data/recipes.json', 'utf8')) as { id: string; title: string }[];

test('all thirty GitHub Pages recipe routes are physical HTML entrypoints', () => {
  for (const recipe of recipes) {
    const path = 'dist/recipes/' + recipe.id + '/index.html';
    expect(existsSync(path), 'Missing static deep link ' + path).toBe(true);
    const html = readFileSync(path, 'utf8');
    expect(html).toContain(recipe.title.replaceAll('&', '&amp;').replaceAll('’', '’'));
    expect(html).toContain('rel="canonical" href="https://simondoescode.github.io/nibblepot/recipes/' + recipe.id + '/"');
    expect(html).toContain('application/ld+json');
  }
});

test('direct link refresh keeps the same recipe URL and displays the full page', async ({ page }) => {
  const response = await page.goto('/nibblepot/recipes/chicken-rice/');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'One-pot chicken rice' })).toBeVisible();
  await expect(page).toHaveURL(/\/nibblepot\/recipes\/chicken-rice\/$/);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'One-pot chicken rice' })).toBeVisible();
  await expect(page.locator('.recipe-page-method .steps li')).toHaveCount(3);
  await expect(page.locator('.recipe-page-image img')).toHaveAttribute('src', /chicken-rice\.webp/);
});

test('browser back and forward restore recipe and catalogue', async ({ page }) => {
  await page.goto('/nibblepot/');
  await page.getByRole('link', { name: /view jacket/i }).first().click();
  await expect(page.locator('.recipe-page h1')).toHaveText('Jacket potatoes & beans');
  await page.goBack();
  await expect(page.locator('.recipe-card')).toHaveCount(30);
  await page.goForward();
  await expect(page.locator('.recipe-page h1')).toHaveText('Jacket potatoes & beans');
});

test('favourites and shopping work within the dedicated recipe route', async ({ page }, testInfo) => {
  await page.goto('/nibblepot/recipes/jacket/');
  // The starter larder contains potatoes and beans; explicitly make them missing.
  await page.evaluate(() => localStorage.setItem('nibblepot-demo-v1', JSON.stringify({
    larder: [], favorites: [], shopping: [],
  })));
  await page.reload();
  await page.getByRole('button', { name: /save recipe/i }).click();
  await expect(page.getByRole('button', { name: /saved to favourites/i })).toBeVisible();
  await page.getByRole('button', { name: /add missing bits/i }).click();
  const nav = page.getByRole('navigation', { name: testInfo.project.name === 'mobile' ? 'Mobile navigation' : 'Main navigation' });
  await nav.getByRole('button', { name: 'Shopping' }).click();
  await expect(page).toHaveURL(/\/nibblepot\/shopping\/$/);
  await expect(page.locator('.shop-row').first()).toBeVisible();
});

test('serving changes scale recipe amounts and update shopping quantities', async ({ page }, testInfo) => {
  await page.goto('/nibblepot/recipes/tuna-bake/');
  // Pasta is marked in-stock by default. Test shopping for a user without pasta.
  await page.evaluate(() => localStorage.setItem('nibblepot-demo-v1', JSON.stringify({
    larder: [], favorites: [], shopping: [],
  })));
  await page.reload();
  await expect(page.locator('.recipe-page-ingredients')).toContainText('350 g');
  await page.getByRole('button', { name: 'Fewer servings' }).click();
  await page.getByRole('button', { name: 'Fewer servings' }).click();
  await expect(page.locator('.recipe-page-ingredients')).toContainText('175 g');
  await page.getByRole('button', { name: /add missing bits/i }).click();
  const navName = testInfo.project.name === 'mobile' ? 'Mobile navigation' : 'Main navigation';
  await page.getByRole('navigation', { name: navName }).getByRole('button', { name: 'Shopping' }).click();
  await expect(page.locator('.shop-row').filter({ hasText: 'Pasta' })).toContainText('175 g');
  await page.reload();
  await expect(page.locator('.shop-row').filter({ hasText: 'Pasta' })).toContainText('175 g');
  await page.getByRole('navigation', { name: navName }).getByRole('button', { name: 'Recipes' }).click();
  await page.getByRole('link', { name: /view tuna pasta bake/i }).click();
  await expect(page.locator('output[aria-label="Servings count"]')).toHaveText('2');
});

test('optional ingredients stay off the list until chosen', async ({ page }, testInfo) => {
  await page.goto('/nibblepot/recipes/jacket/');
  await expect(page.locator('.recipe-optional')).toHaveCount(2);
  await page.getByRole('button', { name: /add missing bits/i }).click();
  const navName = testInfo.project.name === 'mobile' ? 'Mobile navigation' : 'Main navigation';
  const nav = page.getByRole('navigation', { name: navName });
  await nav.getByRole('button', { name: 'Shopping' }).click();
  await expect(page.locator('.shop-row').filter({ hasText: 'Butter or spread' })).toHaveCount(0);
  await nav.getByRole('button', { name: 'Recipes' }).click();
  await page.getByRole('link', { name: /view jacket/i }).first().click();
  await page.locator('.recipe-optional').filter({ hasText: 'Include optional ingredient' }).last().getByRole('checkbox').check();
  await page.getByRole('button', { name: /add missing bits/i }).click();
  await nav.getByRole('button', { name: 'Shopping' }).click();
  // Butter is in the starter larder? It isn't, so explicitly opting in adds it.
  await expect(page.locator('.shop-row').filter({ hasText: 'Butter or spread' })).toHaveCount(1);
});

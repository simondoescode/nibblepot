import { test, expect } from '@playwright/test';

test('random dinner and recipe flow', async ({ page }, testInfo) => {
  await page.goto('/nibblepot/');
  await expect(page.getByRole('heading', { name: /what's for/i })).toBeVisible();
  await expect(page.locator('.recipe-card')).toHaveCount(16);
  await page.getByRole('button', { name: '🎲 Surprise me!' }).click();
  await expect(page.getByRole('dialog', { name: /random dinner suggestion/i })).toBeVisible();
  await page.getByRole('button', { name: /see recipe/i }).click();
  await expect(page.getByRole('heading', { name: "What you'll need" })).toBeVisible();
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

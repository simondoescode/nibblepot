import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const ids = ['one-pot-cheesy-tomato-pasta', 'sausage-traybake', 'chicken-stuffing-pie', 'creamy-tuna-sweetcorn-pasta', 'beef-potato-hash'];
const meals = (JSON.parse(readFileSync('src/data/recipes.json', 'utf8')) as { id: string; title: string; image: string }[]).filter(r => ids.includes(r.id));

test('low-effort meals have working direct routes, transparent photos and cooking pages offline', async ({ page, context }) => {
  await page.goto('/nibblepot/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise<void>(resolve => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }));
  });
  await context.setOffline(true);
  for (const meal of meals) {
    await page.goto(`/nibblepot/recipes/${meal.id}/`);
    await expect(page.locator('.recipe-page h1')).toHaveText(meal.title);
    const photo = page.locator('.recipe-page-image img');
    await expect(photo).toHaveAttribute('src', `/nibblepot/${meal.image}`);
    await expect.poll(() => photo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth === 800)).toBe(true);
    expect(await photo.evaluate((img: HTMLImageElement) => {
      const canvas = document.createElement('canvas'); canvas.width = 800; canvas.height = 504;
      const ctx = canvas.getContext('2d')!; ctx.drawImage(img, 0, 0);
      return [[0,0],[799,0],[0,503],[799,503]].map(([x,y]) => ctx.getImageData(x,y,1,1).data[3]);
    })).toEqual([0,0,0,0]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.getByRole('button', { name: 'Start cooking', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/recipes/${meal.id}/cook/`));
  }
});

test('stuffing pie scales cooked chicken and adds it to shopping separately from raw chicken', async ({ page }, info) => {
  await page.goto('/nibblepot/recipes/chicken-stuffing-pie/');
  await page.evaluate(() => localStorage.setItem('nibblepot-demo-v1', JSON.stringify({ larder: ['chicken'], favorites: [], shopping: [] })));
  await page.reload();
  await page.getByRole('button', { name: 'Fewer servings' }).click();
  await page.getByRole('button', { name: 'Fewer servings' }).click();
  await expect(page.locator('.ingredient-line').filter({ hasText: 'Cooked chicken' })).toContainText('200 g');
  await page.getByRole('button', { name: 'Save recipe', exact: true }).click();
  await page.getByRole('button', { name: 'Add missing bits', exact: true }).click();
  await page.getByRole('navigation', { name: info.project.name === 'mobile' ? 'Mobile navigation' : 'Main navigation' }).getByRole('button', { name: 'Shopping', exact: true }).click();
  await expect(page.locator('.shop-row').filter({ hasText: 'Cooked chicken' })).toContainText('200 g');
  await page.reload();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('nibblepot-demo-v1')!).favorites)).toContain('chicken-stuffing-pie');
});

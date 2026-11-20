import { test, expect } from '@playwright/test';

const friday = new Date(2026, 10, 20, 19);
test.beforeEach(async ({page}) => { await page.clock.setFixedTime(friday); });
test('Friday starts empty, saves dinner and keeps it independent of search', async ({page}) => {
  await page.goto('/nibblepot/');
  const hero = page.getByRole('region', {name: "Tonight's dinner"});
  await expect(hero.getByRole('heading', {name: 'Plan tonight'})).toBeVisible();
  await expect(page.locator('[aria-current="date"]')).toContainText('Today');
  await expect(page.locator('[aria-current="date"]')).toBeInViewport();
  await hero.getByRole('button', {name: 'Plan tonight', exact:true}).click();
  await expect(page.getByRole('dialog')).toContainText('Dinner for Friday');
  await page.getByRole('searchbox', {name:'Search dinners'}).fill('Jacket potatoes');
  await page.getByRole('button', {name:/Jacket potatoes.*min/}).click();
  await expect(hero.getByRole('heading')).toContainText('Jacket potatoes');
  await page.getByRole('searchbox', {name:'Search recipes',exact:true}).fill('fish pie');
  await expect(hero.getByRole('heading')).toContainText('Jacket potatoes');
  await page.reload();
  await expect(hero.getByRole('heading')).toContainText('Jacket potatoes');
  await hero.getByRole('button', {name:'View recipe'}).click();
  await expect(page).toHaveURL(/recipes\/jacket-potatoes-and-beans\//);
});
for (const kind of ['leftovers','freezer'] as const) test(`shows saved ${kind} night without a random recipe`, async ({page}) => {
  await page.addInitScript(kind => localStorage.setItem('simmer-recipes-v2', JSON.stringify({larder:[],favorites:[],shopping:[],weekPlans:{'2026-11-16':Array.from({length:7},()=>({kind}))}})), kind);
  await page.goto('/nibblepot/');
  const hero=page.getByRole('region', {name:"Tonight's dinner"});
  await expect(hero.getByRole('heading')).toHaveText(kind==='leftovers'?'Leftovers night':'Freezer night');
  await expect(hero.getByRole('button',{name:'View recipe'})).toHaveCount(0);
});

import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';

const recipeIds = JSON.parse(readFileSync('src/data/recipes.json', 'utf8')) as {id:string;title:string}[];

test('every cooking route is a physical GitHub Pages entry with noindex and recipe canonical', () => {
  for (const recipe of recipeIds) {
    const filename = `dist/recipes/${recipe.id}/cook/index.html`;
    expect(existsSync(filename), filename).toBe(true);
    const html = readFileSync(filename,'utf8');
    expect(html).toContain('Cook ' + recipe.title.replaceAll('&','&amp;'));
    expect(html).toContain('name="robots" content="noindex,follow"');
    expect(html).toContain(
      'rel="canonical" href="https://simondoescode.github.io/nibblepot/recipes/' + recipe.id + '/"'
    );
  }
});

test('start cooking opens a dedicated route with next, previous and completion controls', async ({page}) => {
  await page.goto('/nibblepot/recipes/tomato-pasta/');
  await page.getByRole('button',{name:'Start cooking'}).click();
  await expect(page).toHaveURL(/\/nibblepot\/recipes\/tomato-pasta\/cook\/$/);
  await expect(page.getByText('Cook pasta in salted water.')).toBeVisible();
  await expect(page.getByRole('navigation',{name:'Main navigation'})).toHaveCount(0);
  await expect(page.locator('.cook-checklist input')).toHaveCount(5);
  await expect(page.getByRole('button',{name:'Previous'})).toBeDisabled();
  await page.getByRole('button',{name:'Next step'}).click();
  await expect(page.getByText(/Gently fry garlic/)).toBeVisible();
  await page.getByRole('button',{name:'Previous'}).click();
  await expect(page.getByText('Cook pasta in salted water.')).toBeVisible();
  await page.getByRole('button',{name:'Next step'}).click();
  await page.getByRole('button',{name:'Next step'}).click();
  await page.getByRole('button',{name:'Finish cooking'}).click();
  await expect(page.getByRole('heading',{name:"Dinner's ready!"})).toBeVisible();
  await page.getByRole('button',{name:'Cook again'}).click();
  await expect(page.getByText('Cook pasta in salted water.')).toBeVisible();
  await page.getByRole('button',{name:'Recipe',exact:true}).click();
  await expect(page).toHaveURL(/\/nibblepot\/recipes\/tomato-pasta\/$/);
});

test('direct cooking link and refresh keep step and checked ingredients for the same tab', async ({page}) => {
  const response=await page.goto('/nibblepot/recipes/jacket/cook/');
  expect(response?.status()).toBe(200);
  await page.locator('.cook-checklist label').filter({hasText:'Potatoes'}).getByRole('checkbox').check();
  await page.getByRole('button',{name:'Next step'}).click();
  await expect(page.getByText('Heat the beans in a saucepan.')).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/\/nibblepot\/recipes\/jacket\/cook\/$/);
  await expect(page.getByText('Heat the beans in a saucepan.')).toBeVisible();
  await expect(page.locator('.cook-checklist label').filter({hasText:'Potatoes'}).getByRole('checkbox')).toBeChecked();
  await expect(page.locator('.cook-ingredients summary')).toContainText('1/4');
});

test('explicit step duration starts and pauses a countdown, survives a refresh, and resets', async ({page}) => {
  await page.goto('/nibblepot/recipes/jacket/cook/');
  await page.getByRole('button',{name:'45 min',exact:true}).click();
  await expect(page.locator('.cook-timer-time')).toHaveText('45:00');
  await page.getByRole('button',{name:'Start timer'}).click();
  await expect(page.getByRole('button',{name:'Pause'})).toBeVisible();
  await page.getByRole('button',{name:'Next step'}).click();
  await page.reload();
  await expect(page.getByRole('button',{name:'Pause'})).toBeVisible();
  await page.getByRole('button',{name:'Pause'}).click();
  await expect(page.getByRole('button',{name:'Start timer'})).toBeVisible();
  await page.getByRole('button',{name:'Reset'}).click();
  await expect(page.locator('.cook-timer-time')).toHaveText('05:00');
  await page.getByRole('button',{name:'Subtract one minute'}).click();
  await expect(page.locator('.cook-timer-time')).toHaveText('04:00');
});

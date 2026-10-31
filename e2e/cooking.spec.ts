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

test('start cooking opens a dedicated route with next, previous and completion controls', async ({page}, testInfo) => {
  await page.goto('/nibblepot/recipes/tomato-pasta/');
  await page.getByRole('button',{name:'Start cooking'}).click();
  await expect(page).toHaveURL(/\/nibblepot\/recipes\/tomato-pasta\/cook\/$/);
  await expect(page.getByText('Cook pasta in salted water.')).toBeVisible();
  await expect(page.getByRole('navigation',{name:'Main navigation'})).toHaveCount(0);
  if (testInfo.project.name === 'mobile') {
    await page.getByRole('button', {name:'Open ingredient checklist'}).click();
    await expect(page.getByRole('dialog', {name:'Ingredients'})).toBeVisible();
  }
  await expect(page.locator('.cook-checklist input')).toHaveCount(5);
  if (testInfo.project.name === 'mobile') {
    await page.getByRole('button', {name:'Close cooking tools'}).click();
  }
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

test('direct cooking link and refresh keep step and checked ingredients for the same tab', async ({page}, testInfo) => {
  const response=await page.goto('/nibblepot/recipes/jacket/cook/');
  expect(response?.status()).toBe(200);
  if (testInfo.project.name === 'mobile') await page.getByRole('button', {name:'Open ingredient checklist'}).click();
  await page.locator('.cook-checklist label').filter({hasText:'Potatoes'}).getByRole('checkbox').check();
  if (testInfo.project.name === 'mobile') await page.getByRole('button', {name:'Close cooking tools'}).click();
  await page.getByRole('button',{name:'Next step'}).click();
  await expect(page.getByText('Heat the beans in a saucepan.')).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/\/nibblepot\/recipes\/jacket\/cook\/$/);
  await expect(page.getByText('Heat the beans in a saucepan.')).toBeVisible();
  if (testInfo.project.name === 'mobile') await page.getByRole('button', {name:'Open ingredient checklist'}).click();
  await expect(page.locator('.cook-checklist label').filter({hasText:'Potatoes'}).getByRole('checkbox')).toBeChecked();
  await expect(page.locator('.cook-ingredients summary')).toContainText('1/4');
});

test('explicit step duration starts and pauses a countdown, survives a refresh, and resets', async ({page}, testInfo) => {
  await page.goto('/nibblepot/recipes/jacket/cook/');
  if (testInfo.project.name === 'mobile') await page.getByRole('button', {name:'Open kitchen timer'}).click();
  await page.getByRole('button',{name:'45 min',exact:true}).click();
  await expect(page.locator('.cook-timer-time')).toHaveText('45:00');
  await page.getByRole('button',{name:'Start timer'}).click();
  await expect(page.getByRole('button',{name:'Pause'})).toBeVisible();
  if (testInfo.project.name === 'mobile') await page.getByRole('button', {name:'Close cooking tools'}).click();
  await page.getByRole('button',{name:'Next step'}).click();
  await page.reload();
  if (testInfo.project.name === 'mobile') await page.getByRole('button', {name:'Open kitchen timer'}).click();
  await expect(page.getByRole('button',{name:'Pause'})).toBeVisible();
  await page.getByRole('button',{name:'Pause'}).click();
  await expect(page.getByRole('button',{name:'Start timer'})).toBeVisible();
  await page.getByRole('button',{name:'Reset'}).click();
  await expect(page.locator('.cook-timer-time')).toHaveText('05:00');
  await page.getByRole('button',{name:'Subtract one minute'}).click();
  await expect(page.locator('.cook-timer-time')).toHaveText('04:00');
});

test('mobile cooking controls stay thumb-reachable while scrolling, sheets close on Escape', async ({page}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Fixed thumb controls are mobile-only');
  await page.goto('/nibblepot/recipes/sausage-bean/cook/');
  const dock = page.locator('.cook-step-actions');
  const tools = page.locator('.cook-mobile-tools');
  await expect(dock).toBeVisible();
  await expect(tools).toBeVisible();
  const viewport = page.viewportSize()!;
  const original = await dock.boundingBox();
  expect(original).not.toBeNull();
  expect(original!.y + original!.height).toBeLessThanOrEqual(viewport.height + 1);
  expect(original!.height).toBeGreaterThanOrEqual(60);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const after = await dock.boundingBox();
  expect(after).not.toBeNull();
  expect(Math.abs(after!.y - original!.y)).toBeLessThan(2);
  await page.getByRole('button',{name:'Open ingredient checklist'}).click();
  const sheet=page.getByRole('dialog',{name:'Ingredients'});
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('.cook-checklist input')).toHaveCount(5);
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Open ingredient checklist'})).toBeFocused();
  await page.getByRole('button',{name:'Next step'}).click();
  await expect(page.getByText(/Soften the chopped onion/)).toBeVisible();
});

test('mobile timer chip reflects countdown while sheet is closed and the desktop keeps both panels', async ({page},testInfo) => {
  await page.goto('/nibblepot/recipes/jacket/cook/');
  if (testInfo.project.name === 'mobile') {
    await page.getByRole('button',{name:'Open kitchen timer'}).click();
    await page.getByRole('button',{name:'Start timer'}).click();
    await page.getByRole('button',{name:'Close cooking tools'}).click();
    await expect(page.locator('.cook-mobile-tools')).toContainText('Timer');
    await expect(page.locator('.cook-mobile-tools')).toContainText(/04:\d\d/);
    await page.reload();
    await expect(page.locator('.cook-mobile-tools')).toContainText(/04:\d\d/);
  } else {
    await expect(page.locator('.cook-mobile-tools')).toHaveCount(0);
    await expect(page.locator('.cook-timer')).toBeVisible();
    await expect(page.locator('.cook-ingredients')).toBeVisible();
  }
});

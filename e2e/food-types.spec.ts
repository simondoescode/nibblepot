import { expect, test } from '@playwright/test';

test('food types combine with search and quick filters and can be cleared',async ({page})=>{
  await page.goto('/nibblepot/');
  const food=page.getByRole('combobox',{name:'Food type'});
  await food.selectOption('chicken');
  await page.getByRole('button',{name:/30 mins or less/}).click();
  await page.getByRole('searchbox',{name:'Search recipes'}).fill('tomato');
  await expect(page.locator('.recipe-card')).toHaveCount(1);
  await expect(page.locator('.recipe-card h3')).toHaveText('Chicken & tomato pasta');
  await expect(page.locator('.recipe-result-count')).toHaveText('1 of 40 recipes');
  await food.selectOption('fish');
  await expect(page.getByRole('heading',{name:'No recipes found'})).toBeVisible();
  await page.getByRole('button',{name:'Show everything'}).click();
  await expect(food).toHaveValue('all');
  await expect(page.getByRole('searchbox')).toHaveValue('');
  await expect(page.locator('.recipe-card')).toHaveCount(40);
  await food.selectOption('rice');
  await page.getByRole('button',{name:'Clear filters',exact:true}).click();
  await expect(food).toHaveValue('all');
  await expect(page.locator('.recipe-card')).toHaveCount(40);
});

test('food selection survives opening a recipe and returning to the list',async ({page})=>{
  await page.goto('/nibblepot/');
  await page.getByRole('combobox',{name:'Food type'}).selectOption('fish');
  await expect(page.locator('.recipe-card')).toHaveCount(4);
  await page.getByRole('link',{name:'Open recipe: Tuna pasta bake',exact:true}).click();
  await page.goBack();
  await expect(page.getByRole('combobox',{name:'Food type'})).toHaveValue('fish');
  await expect(page.locator('.recipe-card')).toHaveCount(4);
});

test('finding meals from the larder resets a previous food restriction',async ({page},info)=>{
  await page.goto('/nibblepot/');
  await page.getByRole('combobox',{name:'Food type'}).selectOption('fish');
  const nav=page.getByRole('navigation',{name:info.project.name==='mobile'?'Mobile navigation':'Main navigation'});
  await nav.getByRole('button',{name:'Larder',exact:true}).click();
  if(info.project.name==='mobile') await page.locator('.larder-meals-bar button').click();
  else await page.getByRole('button',{name:'What can I make?'}).click();
  await expect(page.getByRole('combobox',{name:'Food type'})).toHaveValue('all');
  await expect(page.getByRole('button',{name:/Use my larder/})).toHaveAttribute('aria-pressed','true');
});

for(const width of [320,390]) test(`food selector fits ${width}px screens`,async ({page},info)=>{
  test.skip(info.project.name!=='mobile');
  await page.setViewportSize({width,height:800});
  await page.goto('/nibblepot/');
  const food=page.getByRole('combobox',{name:'Food type'});
  await food.selectOption('meat-free');
  await food.scrollIntoViewIfNeeded();
  const box=await food.boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(44);
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x+box!.width).toBeLessThanOrEqual(width);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
});

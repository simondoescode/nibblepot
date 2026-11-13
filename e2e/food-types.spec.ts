import { expect, test, type Page } from '@playwright/test';

async function chooseTypes(page:Page, types:string[]) {
  await page.getByRole('button',{name:/Food types/}).click();
  const sheet=page.getByRole('dialog',{name:'Choose food types'});
  await sheet.getByRole('button',{name:'Clear selection'}).click();
  for(const name of types) await sheet.getByRole('checkbox',{name,exact:true}).check();
  await sheet.getByRole('button',{name:'Apply filters'}).click();
}

test('multiple food types combine with search and quick filters and can be cleared',async ({page})=>{
  await page.goto('/nibblepot/');
  await chooseTypes(page,['Chicken','Fish']);
  await page.getByRole('button',{name:/30 mins or less/}).click();
  await page.getByRole('searchbox',{name:'Search recipes'}).fill('tomato');
  await expect(page.locator('.recipe-card')).toHaveCount(1);
  await expect(page.locator('.recipe-card h3')).toHaveText('Chicken & tomato pasta');
  await expect(page.locator('.recipe-result-count')).toHaveText('1 of 45 recipes');
  await chooseTypes(page,['Fish']);
  await expect(page.getByRole('heading',{name:'No recipes found'})).toBeVisible();
  await page.getByRole('button',{name:'Show everything'}).click();
  await expect(page.getByRole('button',{name:/Food types/})).toContainText('All food');
  await expect(page.getByRole('searchbox')).toHaveValue('');
  await expect(page.locator('.recipe-card')).toHaveCount(45);
  await chooseTypes(page,['Rice']);
  await page.getByRole('button',{name:'Clear filters',exact:true}).click();
  await expect(page.locator('.recipe-card')).toHaveCount(45);
});

test('selected categories match either type and can be removed individually',async ({page})=>{
  await page.goto('/nibblepot/');
  await chooseTypes(page,['Chicken','Fish']);
  await expect(page.getByRole('button',{name:/Food types/})).toContainText('2 selected');
  await expect(page.getByRole('heading',{name:'Tuna pasta bake',exact:true})).toBeVisible();
  await expect(page.locator('#home-results').getByRole('heading',{name:'One-pot chicken rice',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Speedy tomato pasta',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Remove Chicken filter',exact:true}).click();
  await expect(page.locator('.recipe-card')).toHaveCount(5);
  await page.getByRole('button',{name:'Remove Fish filter',exact:true}).click();
  await expect(page.locator('.recipe-card')).toHaveCount(45);
});

test('food selections survive opening a recipe and returning to the list',async ({page})=>{
  await page.goto('/nibblepot/');
  await chooseTypes(page,['Fish','Rice']);
  await page.getByRole('link',{name:'Tuna pasta bake',exact:true}).click();
  await page.goBack();
  await expect(page.getByRole('button',{name:/Food types/})).toContainText('2 selected');
  await expect(page.getByRole('button',{name:'Remove Rice filter'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Remove Fish filter'})).toBeVisible();
});

test('picker cancels on Escape and restores focus without applying draft changes',async ({page})=>{
  await page.goto('/nibblepot/');
  const trigger=page.getByRole('button',{name:/Food types/});
  await trigger.click();
  const sheet=page.getByRole('dialog',{name:'Choose food types'});
  await sheet.getByRole('checkbox',{name:'Fish',exact:true}).check();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await expect(page.locator('.recipe-card')).toHaveCount(45);
  await trigger.click();
  await expect(sheet.getByRole('checkbox',{name:'Fish',exact:true})).not.toBeChecked();
  await sheet.getByRole('checkbox',{name:'Fish',exact:true}).check();
  await sheet.getByRole('button',{name:'Apply filters'}).click();
  await trigger.click();
  await sheet.getByRole('button',{name:'Clear selection'}).click();
  await sheet.getByRole('button',{name:'Apply filters'}).click();
  await expect(page.locator('.recipe-card')).toHaveCount(45);
});

test('finding meals from the larder clears previous food restrictions',async ({page},info)=>{
  await page.goto('/nibblepot/');
  await chooseTypes(page,['Fish','Chicken']);
  const nav=page.getByRole('navigation',{name:info.project.name==='mobile'?'Mobile navigation':'Main navigation'});
  await nav.getByRole('button',{name:'Larder',exact:true}).click();
  if(info.project.name==='mobile') await page.locator('.larder-meals-bar button').click();
  else await page.getByRole('button',{name:'What can I make?'}).click();
  await expect(page.getByRole('button',{name:/Food types/})).toContainText('All food');
  await expect(page.locator('button.chip[aria-pressed]').filter({hasText:'Use my larder'})).toHaveAttribute('aria-pressed','true');
});

for(const width of [320,390]) test(`multi-select picker fits ${width}px screens`,async ({page},info)=>{
  test.skip(info.project.name!=='mobile');
  await page.setViewportSize({width,height:800});
  await page.goto('/nibblepot/');
  await page.getByRole('button',{name:/Food types/}).click();
  const picker=page.getByRole('dialog',{name:'Choose food types'});
  await expect(picker.getByRole('checkbox')).toHaveCount(8);
  const box=await picker.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x+box!.width).toBeLessThanOrEqual(width);
  await picker.getByRole('checkbox',{name:'Meat-free',exact:true}).check();
  await picker.getByRole('checkbox',{name:'Rice',exact:true}).check();
  await picker.getByRole('button',{name:'Apply filters'}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
  await expect(page.getByRole('button',{name:/Food types/})).toContainText('2 selected');
});

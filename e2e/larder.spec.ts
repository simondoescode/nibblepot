import { test, expect } from '@playwright/test';

test('stock details save atomically, cancel safely and survive reload', async ({page}) => {
  await page.goto('/nibblepot/larder/');
  const trigger = page.getByRole('button', {name:'Edit Potatoes stock details'});
  await trigger.click();
  const sheet = page.getByRole('dialog', {name:'Potatoes',exact:true});
  await sheet.getByRole('spinbutton', {name:'Potatoes amount'}).fill('200');
  await sheet.getByRole('combobox',{name:'Unit',exact:true}).selectOption('g');
  await sheet.getByLabel('Potatoes use-by date').fill('2026-12-01');
  await sheet.getByRole('button',{name:'Save details'}).click();
  await expect(trigger).toContainText('200 g');
  await expect(trigger).toBeFocused();
  await expect(page.getByRole('checkbox',{name:'Potatoes',exact:true})).toBeChecked();
  await page.reload();
  await expect(trigger).toContainText('200 g');
  await trigger.click();
  await expect(sheet.getByLabel('Potatoes use-by date')).toHaveValue('2026-12-01');
  await sheet.getByRole('spinbutton').fill('999');
  await sheet.getByRole('button',{name:'Cancel',exact:true}).click();
  await expect(trigger).toContainText('200 g');
  await trigger.click();
  await sheet.getByRole('spinbutton').fill('');
  await sheet.getByLabel('Potatoes use-by date').fill('');
  await sheet.getByRole('button',{name:'Save details'}).click();
  await expect(trigger).toHaveText('Add amount');
  await page.getByRole('checkbox',{name:'Potatoes',exact:true}).uncheck();
  await expect(trigger).toHaveCount(0);
});

test('filters combine with search and stock changes without losing hidden items', async ({page}) => {
  await page.goto('/nibblepot/larder/');
  await page.getByRole('button',{name:'In stock',exact:true}).click();
  const count = await page.locator('.larder-item').count();
  expect(count).toBeGreaterThan(0);
  // Removing stock immediately removes the row from this filtered view.
  await page.getByRole('checkbox',{name:'Potatoes',exact:true}).click();
  await expect(page.locator('.larder-item')).toHaveCount(count-1);
  await page.getByRole('button',{name:'Freezer',exact:true}).click();
  await expect(page.locator('.larder-group h3')).toContainText('Freezer');
  await page.getByRole('searchbox').fill('Potatoes');
  await expect(page.locator('.larder-item')).toHaveCount(0);
  await page.getByRole('button',{name:'Show all ingredients'}).click();
  await expect(page.locator('.larder-item')).toHaveCount(41);
  await expect(page.getByRole('checkbox',{name:'Potatoes',exact:true})).not.toBeChecked();
});

test('legacy custom amounts remain intact when changing just the date', async ({page}) => {
  await page.goto('/nibblepot/larder/');
  await page.evaluate(()=>{
    const data=JSON.parse(localStorage.getItem('nibblepot-demo-v1') || '{}');
    data.larderQuantities={potatoes:'2 small tins'};
    localStorage.setItem('nibblepot-demo-v1',JSON.stringify(data));
  });
  await page.reload();
  await page.getByRole('button',{name:'Edit Potatoes stock details'}).click();
  const sheet=page.getByRole('dialog',{name:'Potatoes',exact:true});
  await expect(sheet.getByLabel('Potatoes quantity in stock')).toHaveValue('2 small tins');
  await sheet.getByLabel('Potatoes use-by date').fill('2026-12-01');
  await sheet.getByRole('button',{name:'Save details'}).click();
  await expect(page.getByRole('button',{name:'Edit Potatoes stock details'})).toContainText('2 small tins');
});

for (const width of [320,390,430]) {
  test(`larder fits ${width}px phones with reachable search and meal action`, async ({page}, info) => {
    test.skip(info.project.name!=='mobile');
    await page.setViewportSize({width,height:800});
    await page.goto('/nibblepot/larder/');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
    const rows=await page.locator('.larder-item').evaluateAll(items=>items.map(item=>item.getBoundingClientRect().width));
    expect(rows.every(row=>row>width-50)).toBe(true);
    await page.evaluate(()=>window.scrollTo(0,500));
    const tools=await page.locator('.larder-tools').boundingBox();
    const header=await page.locator('.app-header-shell').boundingBox();
    expect(tools?.y).toBeCloseTo(header!.height,0);
    const action=page.locator('.larder-meals-bar');
    const before=await action.boundingBox();
    expect(before!.y+before!.height).toBeLessThanOrEqual(730);
    await page.evaluate(()=>window.scrollTo(0,1000));
    expect((await action.boundingBox())!.y).toBeCloseTo(before!.y,0);
    await action.getByRole('button').click();
    await expect(page).toHaveURL(/\/nibblepot\/$/);
    await expect(page.getByRole('button',{name:/Use my larder/})).toHaveAttribute('aria-pressed','true');
  });
}

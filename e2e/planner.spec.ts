import { test, expect } from '@playwright/test';

test('planner has seven days, shuffles, saves and updates a consolidated list', async ({page},testInfo)=>{
  await page.goto('/nibblepot/');
  const nav = page.getByRole('navigation',{name:testInfo.project.name==='mobile'?'Mobile navigation':'Main navigation'});
  await nav.getByRole('button',{name:'Planner'}).click();
  await expect(page).toHaveURL(/\/nibblepot\/planner\/$/);
  await expect(page.locator('.planner-day')).toHaveCount(7);
  await page.getByRole('button',{name:'Clear week'}).click();
  await expect(page.locator('.planner-day-main select').first()).toHaveValue('empty');
  await page.locator('#planner-slot-0').selectOption('recipe:tomato-pasta');
  await page.locator('#planner-slot-1').selectOption('recipe:tomato-pasta');
  await page.locator('#planner-slot-2').selectOption('leftovers');
  await expect(page.locator('.planner-big')).toContainText('2planned dinners');
  // Start with a blank larder so pasta is actually missing.
  await page.evaluate(()=>localStorage.setItem('nibblepot-demo-v1',JSON.stringify({
    larder:[], favorites:[], shopping:[], weekPlans:JSON.parse(localStorage.getItem('nibblepot-demo-v1')||'{}').weekPlans
  })));
  await page.reload();
  await expect(page.locator('#planner-slot-0')).toHaveValue('recipe:tomato-pasta');
  await page.getByRole('button',{name:'Add week to shopping'}).click();
  await expect(page).toHaveURL(/\/nibblepot\/shopping\/$/);
  await expect(page.locator('.shop-row').filter({hasText:'Pasta'})).toContainText('700 g');
  await page.reload();
  await expect(page.locator('.shop-row').filter({hasText:'Pasta'})).toContainText('700 g');
  await nav.getByRole('button',{name:'Planner'}).click();
  await page.getByRole('button',{name:'Next week'}).click();
  await expect(page.locator('.planner-day')).toHaveCount(7);
  await page.getByRole('button',{name:'Previous week'}).click();
  await expect(page.locator('#planner-slot-0')).toHaveValue('recipe:tomato-pasta');
  await page.getByRole('button',{name:'Shuffle dinners'}).click();
  await expect(page.locator('#planner-slot-2')).toHaveValue('leftovers');
  const chosen=await page.locator('.planner-day-main select').evaluateAll(nodes=>nodes.map(n=>(n as HTMLSelectElement).value));
  expect(chosen[0]).not.toBe(chosen[1]);
});

test('searchable larder filters groups, updates stock and handles empty results',async ({page},testInfo)=>{
  await page.goto('/nibblepot/larder/');
  const search=page.getByRole('searchbox',{name:'Search larder ingredients'});
  await search.fill('PEA');
  await expect(page.locator('.larder-item')).toHaveCount(1);
  await expect(page.locator('.larder-item')).toContainText('Frozen peas');
  await page.locator('.larder-item').getByRole('checkbox').check();
  await expect(page.locator('.larder-aside')).toContainText('8');
  await search.fill('not-a-real-ingredient');
  await expect(page.getByText(/no ingredients match/i)).toBeVisible();
  await page.getByRole('button',{name:'Clear larder search'}).click();
  await expect(page.locator('.larder-item')).toHaveCount(35);
  await page.reload();
  const nav=page.getByRole('navigation',{name:testInfo.project.name==='mobile'?'Mobile navigation':'Main navigation'});
  await nav.getByRole('button',{name:'Larder'}).click();
  await page.getByRole('searchbox',{name:'Search larder ingredients'}).fill('peas');
  await expect(page.locator('.larder-item').getByRole('checkbox')).toBeChecked();
});

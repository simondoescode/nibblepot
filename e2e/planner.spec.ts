import { test, expect, type Page } from '@playwright/test';

async function chooseMeal(page:Page,day:string,title:string) {
  await page.getByRole('button',{name:'Change '+day+' dinner'}).click();
  await page.getByRole('dialog',{name:'Change '+day+' dinner'})
    .getByRole('button',{name:'Choose '+title}).click();
}


test('planner has seven days, shuffles, saves and updates a consolidated list', async ({page},testInfo)=>{
  await page.goto('/nibblepot/');
  const nav = page.getByRole('navigation',{name:testInfo.project.name==='mobile'?'Mobile navigation':'Main navigation'});
  await nav.getByRole('button',{name:'Planner'}).click();
  await expect(page).toHaveURL(/\/nibblepot\/planner\/$/);
  await expect(page.locator('.planner-day')).toHaveCount(7);
  await page.getByRole('button',{name:'Clear week'}).click();
  await page.getByRole('button',{name:'Confirm clear week'}).click();
  await expect(page.getByRole('button',{name:'Change Monday dinner'})).toContainText('Choose a dinner');
  await chooseMeal(page,'Monday','Speedy tomato pasta');
  await chooseMeal(page,'Tuesday','Speedy tomato pasta');
  await page.getByRole('button',{name:'Change Wednesday dinner'}).click();
  await page.getByRole('dialog',{name:'Change Wednesday dinner'})
    .getByRole('button',{name:'Leftovers'}).click();
  await expect(page.locator('.planner-big')).toContainText('2planned dinners');
  // Start with a blank larder so pasta is actually missing.
  await page.evaluate(()=>localStorage.setItem('nibblepot-demo-v1',JSON.stringify({
    larder:[], favorites:[], shopping:[], weekPlans:JSON.parse(localStorage.getItem('nibblepot-demo-v1')||'{}').weekPlans
  })));
  await page.reload();
  await expect(page.getByRole('button',{name:'Change Monday dinner'})).toContainText('Speedy tomato pasta');
  await page.getByRole('button',{name:'Add week to shopping'}).click();
  await expect(page).toHaveURL(/\/nibblepot\/shopping\/$/);
  await expect(page.locator('.shop-row').filter({hasText:'Pasta'})).toContainText('700 g');
  await page.reload();
  await expect(page.locator('.shop-row').filter({hasText:'Pasta'})).toContainText('700 g');
  await nav.getByRole('button',{name:'Planner'}).click();
  await page.getByRole('button',{name:'Next week'}).click();
  await expect(page.locator('.planner-day')).toHaveCount(7);
  await page.getByRole('button',{name:'Previous week'}).click();
  await expect(page.getByRole('button',{name:'Change Monday dinner'})).toContainText('Speedy tomato pasta');
  await page.getByRole('button',{name:'Shuffle dinners'}).click();
  await expect(page.getByRole('button',{name:'Change Wednesday dinner'})).toContainText('Leftovers night');
  const chosen=await page.locator('.planner-picked strong').allTextContents();
  expect(chosen[0]).not.toBe(chosen[1]);
});

test('searchable larder filters groups, updates stock and handles empty results',async ({page},testInfo)=>{
  await page.goto('/nibblepot/larder/');
  const search=page.getByRole('searchbox',{name:'Search larder ingredients'});
  await search.fill('Frozen peas');
  await expect(page.locator('.larder-item')).toHaveCount(1);
  await expect(page.locator('.larder-item')).toContainText('Frozen peas');
  await page.locator('.larder-item').getByRole('checkbox').check();
  await expect(page.locator('.larder-aside')).toContainText('8');
  await search.fill('not-a-real-ingredient');
  await expect(page.getByText(/no ingredients match/i)).toBeVisible();
  await page.getByRole('button',{name:'Clear larder search'}).click();
  await expect(page.locator('.larder-item')).toHaveCount(41);
  await page.reload();
  const nav=page.getByRole('navigation',{name:testInfo.project.name==='mobile'?'Mobile navigation':'Main navigation'});
  await nav.getByRole('button',{name:'Larder'}).click();
  await page.getByRole('searchbox',{name:'Search larder ingredients'}).fill('Frozen peas');
  await expect(page.locator('.larder-item').getByRole('checkbox')).toBeChecked();
});


test('changing a dinner is searchable, filtered, undoable and keyboard accessible', async ({page}) => {
  await page.goto('/nibblepot/planner/');
  const monday=page.getByRole('button',{name:'Change Monday dinner'});
  await monday.click();
  const picker=page.getByRole('dialog',{name:'Change Monday dinner'});
  await expect(picker).toBeVisible();
  await expect(picker.locator('.planner-meal-option')).toHaveCount(30);
  await picker.getByRole('button',{name:'30 min or less'}).click();
  await expect(picker.locator('.planner-meal-option').count()).resolves.toBeLessThan(30);
  await picker.getByRole('button',{name:'All meals'}).click();
  await picker.getByRole('searchbox',{name:'Search meals'}).fill('fried rice');
  await expect(picker.locator('.planner-meal-option')).toHaveCount(1);
  await picker.getByRole('button',{name:'Choose Egg fried rice'}).click();
  await expect(picker).toHaveCount(0);
  await expect(monday).toContainText('Egg fried rice');
  await expect(page.locator('.planner-undo')).toContainText('Monday dinner changed');
  await page.getByRole('button',{name:'Undo'}).click();
  await expect(monday).toContainText('Jacket potatoes');
  await monday.click();
  await page.keyboard.press('Escape');
  await expect(picker).toHaveCount(0);
  await expect(monday).toBeFocused();
  await monday.click();
  await picker.getByRole('button',{name:'Leftovers'}).click();
  await expect(monday).toContainText('Leftovers night');
  await page.reload();
  await expect(monday).toContainText('Leftovers night');
});

test('changing a plan flags stale shopping without replacing the existing list', async ({page},testInfo) => {
  await page.goto('/nibblepot/planner/');
  await page.evaluate(()=>localStorage.setItem('nibblepot-demo-v1',JSON.stringify({
    larder:[], favorites:[], shopping:[],
  })));
  await page.reload();
  await page.getByRole('button',{name:'Clear week'}).click();
  await page.getByRole('button',{name:'Confirm clear week'}).click();
  await chooseMeal(page,'Monday','Speedy tomato pasta');
  await page.getByRole('button',{name:'Add week to shopping'}).click();
  await expect(page.locator('.shop-row').filter({hasText:'Pasta'})).toContainText('350 g');
  const nav=page.getByRole('navigation',{name:testInfo.project.name==='mobile'?'Mobile navigation':'Main navigation'});
  await nav.getByRole('button',{name:'Planner'}).click();
  await expect(page.locator('.planner-sync')).toContainText('Shopping list matches this week');
  await chooseMeal(page,'Monday','Egg fried rice');
  await expect(page.locator('.planner-sync')).toContainText('Meals changed — update your shopping list');
  await page.reload();
  await expect(page.locator('.planner-sync')).toContainText('Meals changed — update your shopping list');
  await nav.getByRole('button',{name:'Shopping'}).click();
  await expect(page.locator('.shop-row').filter({hasText:'Pasta'})).toHaveCount(1);
  await nav.getByRole('button',{name:'Planner'}).click();
  await page.getByRole('button',{name:'Update shopping list'}).click();
  await expect(page.locator('.shop-row').filter({hasText:'Pasta'})).toHaveCount(0);
  await expect(page.locator('.shop-row').filter({hasText:'Rice'})).toHaveCount(1);
});

test('bulk planner actions can be undone and clearing requires confirmation', async ({page})=>{
  await page.goto('/nibblepot/planner/');
  await page.getByRole('button',{name:'Clear week'}).click();
  await expect(page.getByRole('button',{name:'Confirm clear week'})).toBeVisible();
  await page.getByRole('button',{name:'Cancel'}).click();
  await expect(page.getByRole('button',{name:'Change Monday dinner'})).toContainText('Jacket potatoes');
  await page.getByRole('button',{name:'Clear week'}).click();
  await page.getByRole('button',{name:'Confirm clear week'}).click();
  await expect(page.getByRole('button',{name:'Change Monday dinner'})).toContainText('Choose a dinner');
  await page.getByRole('button',{name:'Undo'}).click();
  await expect(page.getByRole('button',{name:'Change Monday dinner'})).toContainText('Jacket potatoes');
});

import { test, expect, type Page } from '@playwright/test';
import ingredients from '../src/data/ingredients.json' with { type: 'json' };

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
  await expect(page.locator('.larder-item')).toHaveCount(Object.keys(ingredients).length);
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
  await expect(picker.locator('.planner-meal-option')).toHaveCount(41);
  await picker.getByRole('button',{name:'30 min or less'}).click();
  await expect(picker.locator('.planner-meal-option').count()).resolves.toBeLessThan(41);
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
  await expect(page.locator('.planner-sync')).toContainText('Update your shopping list to match this plan.');
  await page.reload();
  await expect(page.locator('.planner-sync')).toContainText('Update your shopping list to match this plan.');
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

test('the narrow planner keeps Today and both meal actions in one row', async ({page}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.clock.setFixedTime(new Date('2026-11-02T12:00:00Z'));
  await page.goto('/nibblepot/planner/');

  const week = page.getByRole('group', { name: 'Choose a week' });
  await expect(week).toContainText('Current week');
  const today = page.locator('.planner-day[data-today]');
  await expect(today.getByText('Today', { exact: true })).toBeVisible();
  await expect(today.locator('[aria-current="date"]')).toContainText('2 Nov');
  const edit = today.getByRole('button', { name: 'Change Monday dinner' });
  const view = today.getByRole('button', { name: 'View recipe for Monday' });
  const editBox = (await edit.boundingBox())!;
  const viewBox = (await view.boundingBox())!;
  expect(viewBox.width).toBeGreaterThanOrEqual(44);
  expect(viewBox.height).toBeGreaterThanOrEqual(44);
  expect(viewBox.x).toBeGreaterThanOrEqual(editBox.x + editBox.width);
  expect(viewBox.y + viewBox.height / 2).toBeCloseTo(editBox.y + editBox.height / 2, 0);
  expect(viewBox.x + viewBox.width).toBeLessThan(320);

  await week.getByRole('button', { name: 'Next week' }).click();
  await expect(today).toHaveCount(0);
  await page.getByRole('button', { name: 'This week', exact: true }).click();
  await expect(today).toHaveCount(1);

  await view.click();
  await expect(page).toHaveURL(/\/recipes\/jacket\/$/);
});

test('planner shows the same shortfall as shopping and can remove an emptied week', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.setFixedTime(new Date('2026-11-02T12:00:00Z'));
  await page.addInitScript(() => {
    if (localStorage.getItem('nibblepot-demo-v1')) return;
    localStorage.setItem('nibblepot-demo-v1', JSON.stringify({
      larder: ['pasta'],
      larderQuantities: { pasta: '100 g' },
      favorites: [],
      shopping: [{ id: 'custom:bin bags', customName: 'Bin bags', done: false, from: [] }],
      weekPlans: {
        '2026-11-02': [{ kind: 'recipe', id: 'tomato-pasta' }, ...Array.from({ length: 6 }, () => ({ kind: 'empty' }))],
      },
    }));
  });
  await page.goto('/nibblepot/planner/');
  const shoppingAction = page.getByRole('button', { name: 'Add week to shopping' });
  await expect(shoppingAction).toBeInViewport({ ratio: 1 });
  await expect(page.locator('.planner-preview li').filter({ hasText: 'Pasta' })).toContainText('250 g');
  await shoppingAction.click();
  await expect(page).toHaveURL(/\/shopping\/$/);
  await expect(page.locator('.shop-row').filter({ hasText: 'Pasta' })).toContainText('250 g');
  const tomatoes = page.getByRole('checkbox', { name: 'Mark Chopped tomatoes as purchased' });
  await tomatoes.check();

  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('button', { name: 'Planner' }).click();
  await page.getByRole('button', { name: 'Clear week', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm clear week' }).click();
  await page.getByRole('button', { name: 'Update shopping list' }).click();
  await expect(page).toHaveURL(/\/shopping\/$/);
  await expect(page.getByRole('checkbox', { name: 'Mark Pasta as purchased' })).toHaveCount(0);
  await expect(tomatoes).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Mark Bin bags as purchased' })).toBeVisible();
});

test('recipe details can plan a dinner for an explicit date after opening from home', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-02T12:00:00Z'));
  await page.goto('/nibblepot/recipes/tomato-pasta/');
  const opener = page.getByRole('button', { name: 'Plan this dinner' });
  const picker = page.getByRole('dialog', { name: 'Plan this dinner' });
  const day = picker.getByLabel('Dinner date');

  await opener.click();
  await expect(day.locator('option:checked')).toHaveText('Monday 2 Nov');
  await expect(picker.getByRole('status')).toContainText('Replaces Jacket potatoes');
  await picker.getByRole('button', { name: 'Replace dinner' }).click();
  await expect(picker).toHaveCount(0);
  await expect(opener).toBeFocused();

  await page.goto('/nibblepot/');
  await page.getByRole('searchbox', { name: 'Search recipes', exact: true }).fill('Speedy tomato pasta');
  await page.getByRole('region', { name: "Tonight's inspiration" }).getByRole('button', { name: 'View recipe' }).click();
  await expect(page).toHaveURL(/\/recipes\/tomato-pasta\/$/);
  await opener.click();
  await expect(picker.getByRole('status')).toContainText('already planned');
  await picker.getByRole('button', { name: 'Next week' }).click();
  await expect(day.locator('option:checked')).toHaveText('Monday 9 Nov');
  await day.selectOption('1');
  await expect(day.locator('option:checked')).toHaveText('Tuesday 10 Nov');
  await expect(picker.getByRole('status')).toContainText('Replaces');
  await picker.getByRole('button', { name: 'Replace dinner' }).click();
  await expect(picker).toHaveCount(0);

  await page.goto('/nibblepot/planner/');
  await expect(page.getByRole('button', { name: 'Change Monday dinner' })).toContainText('Speedy tomato pasta');
  await page.getByRole('button', { name: 'Next week' }).click();
  await expect(page.getByRole('button', { name: 'Change Tuesday dinner' })).toContainText('Speedy tomato pasta');
});

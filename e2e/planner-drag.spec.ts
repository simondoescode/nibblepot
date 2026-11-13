import { test, expect } from '@playwright/test';
test('tablet can drag a recipe onto a day and swap days',async({page})=>{
  await page.setViewportSize({width:1024,height:900});
  await page.goto('/nibblepot/planner/');
  await expect(page.locator('.planner-drag-tray')).toBeVisible();
  await page.locator('.planner-drag-recipe').first().dragTo(page.locator('.planner-day').first());
  const draggedTitle = await page.locator('.planner-drag-recipe').first().innerText();
  await expect(page.locator('.planner-day').first()).toContainText(draggedTitle);
  const before=await page.locator('.planner-day').nth(1).locator('.planner-picked strong').innerText();
  await page.locator('.planner-day').first().dragTo(page.locator('.planner-day').nth(1));
  await expect(page.locator('.planner-day').first().locator('.planner-picked strong')).toHaveText(before);
});
test('phone retains tap-to-choose planner',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/nibblepot/planner/');
  await expect(page.locator('.planner-drag-tray')).toBeHidden();
  await page.getByRole('button',{name:'Change Monday dinner'}).click();
  await expect(page.getByRole('dialog',{name:'Change Monday dinner'})).toBeVisible();
});

test('move controls swap dinners, persist and undo without changing the week',async({page})=>{
  await page.setViewportSize({width:320,height:800});
  await page.goto('/nibblepot/planner/');
  const titles=page.locator('.planner-picked strong');
  const before=await titles.allTextContents();
  await page.getByRole('button',{name:'Move Monday dinner',exact:true}).click();
  await page.getByRole('group',{name:'Move Monday dinner'}).getByRole('button',{name:'Tuesday',exact:true}).click();
  await expect(titles.nth(0)).toHaveText(before[1]);
  await expect(titles.nth(1)).toHaveText(before[0]);
  await page.getByRole('button',{name:'Undo',exact:true}).click();
  await expect(titles.nth(0)).toHaveText(before[0]);
  await page.getByRole('button',{name:'Move Monday dinner',exact:true}).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('group',{name:'Move Monday dinner'}).getByRole('button',{name:'Tuesday',exact:true}).click();
  await page.reload();
  await expect(titles.nth(0)).toHaveText(before[1]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('grip pointer drag swaps dinners and cancelling leaves them unchanged',async({page})=>{
  await page.goto('/nibblepot/planner/');
  const titles=page.locator('.planner-picked strong');
  const before=await titles.allTextContents();
  const grip=page.getByRole('button',{name:'Move Monday dinner',exact:true});
  const target=page.locator('.planner-day').nth(1);
  const a=(await grip.boundingBox())!, b=(await target.boundingBox())!;
  await page.mouse.move(a.x+a.width/2,a.y+a.height/2);
  await page.mouse.down();
  await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:12});
  await expect(target).toHaveAttribute('data-drop-target','true');
  await page.mouse.up();
  await expect(titles.nth(0)).toHaveText(before[1]);
  await expect(titles.nth(1)).toHaveText(before[0]);
  await expect(page.getByRole('group',{name:'Move Monday dinner'})).toHaveCount(0);
  await grip.dispatchEvent('pointercancel',{pointerId:77});
  await expect(titles.nth(0)).toHaveText(before[1]);
});


test('phone touch drag uses the grip without opening a recipe or swiping tabs',async({page,context})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/nibblepot/planner/');
  const grip=page.getByRole('button',{name:'Move Monday dinner',exact:true});
  await grip.scrollIntoViewIfNeeded();
  const titles=page.locator('.planner-picked strong');
  const before=await titles.allTextContents();
  const a=(await grip.boundingBox())!, b=(await page.locator('.planner-day').nth(1).boundingBox())!;
  const cdp=await context.newCDPSession(page);
  const start={x:a.x+a.width/2,y:a.y+a.height/2};
  const end={x:b.x+b.width/2,y:b.y+b.height/2};
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[start]});
  for(let i=1;i<=10;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x+(end.x-start.x)*i/10,y:start.y+(end.y-start.y)*i/10}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect(titles.nth(0)).toHaveText(before[1]);
  await expect(titles.nth(1)).toHaveText(before[0]);
  await expect(page).toHaveURL(/planner\/$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

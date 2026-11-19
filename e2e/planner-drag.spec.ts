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

test('grip pointer drag swaps dinners and cancelling leaves them unchanged',async({page},testInfo)=>{
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
  await expect(page.locator('.planner-drag-float')).toContainText(before[0]);
  await expect(target.locator('.planner-drop-ghost')).toContainText(before[0]);
  await expect(target.locator('.planner-drop-ghost')).toContainText('Monday');
  await expect(page.locator('.planner-day').first()).toHaveAttribute('data-drag-source','true');
  await page.screenshot({path:testInfo.outputPath('drag-preview.png')});
  await page.mouse.up();
  await expect(titles.nth(0)).toHaveText(before[1]);
  await expect(titles.nth(1)).toHaveText(before[0]);
  await expect(page.locator('.planner-drag-float,.planner-drop-ghost')).toHaveCount(0);
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
  await expect(page.locator('.planner-drag-float')).toContainText(before[0]);
  await expect(page.locator('.planner-day').nth(1).locator('.planner-drop-ghost')).toContainText(before[0]);
  const float=(await page.locator('.planner-drag-float').boundingBox())!;
  expect(float.x).toBeGreaterThanOrEqual(0);
  expect(float.x+float.width).toBeLessThanOrEqual(390);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect(page.locator('.planner-drag-float,.planner-drop-ghost')).toHaveCount(0);
  await expect(titles.nth(0)).toHaveText(before[1]);
  await expect(titles.nth(1)).toHaveText(before[0]);
  await expect(page).toHaveURL(/planner\/$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});


test('active drag cancels on Escape, pointer cancellation and outside release without saving',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/nibblepot/planner/');
  const grip=page.getByRole('button',{name:'Move Monday dinner',exact:true});
  await grip.scrollIntoViewIfNeeded();
  const titles=page.locator('.planner-picked strong');
  const before=await titles.allTextContents();
  const saved=await page.evaluate(()=>localStorage.getItem('simmer-recipes-v2'));
  for(const mode of ['escape','cancel','outside','same-day']){
    const a=(await grip.boundingBox())!,b=(await page.locator('.planner-day').nth(1).boundingBox())!;
    await page.mouse.move(a.x+22,a.y+22);
    await page.mouse.down();
    await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:8});
    await expect(page.locator('.planner-drag-float')).toBeVisible();
    await expect(page.locator('.planner-drop-ghost')).toHaveCSS('animation-name','none');
    if(mode==='escape')await page.keyboard.press('Escape');
    if(mode==='cancel')await grip.dispatchEvent('pointercancel');
    if(mode==='outside')await page.mouse.move(2,20);
    if(mode==='same-day')await page.mouse.move(a.x+22,a.y+22);
    await page.mouse.up();
    await expect(page.locator('.planner-drag-float,.planner-drop-ghost')).toHaveCount(0);
    await expect(titles).toHaveText(before);
    expect(await page.evaluate(()=>localStorage.getItem('simmer-recipes-v2'))).toBe(saved);
  }
});

test('holding a drag near the bottom scrolls continuously and stops after cancellation',async({page})=>{
  await page.setViewportSize({width:390,height:600});
  await page.goto('/nibblepot/planner/');
  const grip=page.getByRole('button',{name:'Move Monday dinner',exact:true});
  await grip.scrollIntoViewIfNeeded();
  const a=(await grip.boundingBox())!;
  await page.mouse.move(a.x+22,a.y+22);
  await page.mouse.down();
  await page.mouse.move(190,520,{steps:12});
  const first=await page.evaluate(()=>window.scrollY);
  await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBeGreaterThan(first+20);
  await page.keyboard.press('Escape');
  await page.mouse.up();
  const stopped=await page.evaluate(()=>window.scrollY);
  // Let several animation frames elapse without an active gesture.
  await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())))));
  expect(await page.evaluate(()=>window.scrollY)).toBe(stopped);
  await expect(page.locator('.planner-drag-float')).toHaveCount(0);
});


for(const width of [320,820])test(`drag preview stays inside a ${width}px viewport`,async({page},testInfo)=>{
  await page.setViewportSize({width,height:900});
  await page.goto('/nibblepot/planner/');
  const grip=page.getByRole('button',{name:'Move Monday dinner',exact:true});
  await grip.scrollIntoViewIfNeeded();
  const a=(await grip.boundingBox())!,b=(await page.locator('.planner-day').nth(1).boundingBox())!;
  await page.mouse.move(a.x+22,a.y+22);
  await page.mouse.down();
  await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:8});
  await expect(page.locator('.planner-drop-ghost')).toBeVisible();
  const ghost=(await page.locator('.planner-drop-ghost').boundingBox())!;
  expect(ghost.x).toBeGreaterThanOrEqual(b.x);
  expect(ghost.x+ghost.width).toBeLessThanOrEqual(b.x+b.width);
  const floating=(await page.locator('.planner-drag-float').boundingBox())!;
  expect(floating.x).toBeGreaterThanOrEqual(12);
  expect(floating.x+floating.width).toBeLessThanOrEqual(width-12);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
  await page.screenshot({path:testInfo.outputPath('drag-preview.png')});
  await page.keyboard.press('Escape');
  await page.mouse.up();
});

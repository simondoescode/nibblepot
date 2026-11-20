import {test, expect} from '@playwright/test';

test('mobile tab bar has Lucide tabs, visible active state, direct favourites and recipes settings', async ({page}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile-only tab bar');
  await page.goto('/nibblepot/');
  const nav=page.getByRole('navigation',{name:'Mobile navigation'});
  await expect(nav.getByRole('button')).toHaveCount(5);
  for (const label of ['Recipes','Planner','Larder','Shopping','Favourites']) {
    const button=nav.getByRole('button',{name:label});
    await expect(button).toBeVisible();
    await expect(button.locator('svg')).toHaveCount(1);
    const size=await button.boundingBox();
    expect(size!.height).toBeGreaterThanOrEqual(48);
    expect(size!.width).toBeGreaterThanOrEqual(56);
  }
  await nav.getByRole('button',{name:'Planner'}).click();
  await expect(page).toHaveURL(/\/nibblepot\/planner\/$/);
  await expect(nav.getByRole('button',{name:'Planner'})).toHaveAttribute('aria-current','page');
  await nav.getByRole('button',{name:'Favourites'}).click();
  await expect(page).toHaveURL(/\/nibblepot\/favourites\/$/);
  await expect(nav.getByRole('button',{name:'Favourites'})).toHaveAttribute('aria-current','page');
  await expect(nav.getByRole('button',{name:'More'})).toHaveCount(0);
  await expect(page.locator('.app-header-shell')).toBeHidden();
  await nav.getByRole('button',{name:'Recipes'}).click();
  await page.getByRole('button',{name:'Open settings'}).click();
  await expect(page).toHaveURL(/\/nibblepot\/settings\/$/);
  await expect(page.getByRole('heading',{name:'Settings'})).toBeVisible();
});

test('mobile pull-to-refresh visually displaces page and springs back on a short release',async ({page},testInfo)=>{
  test.skip(testInfo.project.name!=='mobile','Touch-only animation');
  await page.goto('/nibblepot/');
  const visual=page.locator('.pull-body');
  const gesture=await page.evaluate(()=>{
    const target=document.querySelector('.section-heading')!;
    const create=(x:number,y:number)=>new Touch({identifier:37,target,clientX:x,clientY:y});
    const send=(type:string, y:number)=>document.dispatchEvent(new TouchEvent(type,{
      bubbles:true,cancelable:true,touches:type==='touchend'?[]:[create(160,y)],
      changedTouches:[create(160,y)]
    }));
    send('touchstart',85);
    send('touchmove',160);
    return true;
  });
  expect(gesture).toBe(true);
  await expect.poll(()=>visual.evaluate(node=>Number.parseFloat((node as HTMLElement).style.getPropertyValue('--pull-shift')))).toBeGreaterThan(20);
  await expect(page.locator('.pull-native-indicator')).toBeVisible();
  await page.evaluate(()=>{
    const target=document.querySelector('.section-heading')!;
    document.dispatchEvent(new TouchEvent('touchend',{bubbles:true,cancelable:true,touches:[],
      changedTouches:[new Touch({identifier:37,target,clientX:160,clientY:160})]}));
  });
  await expect.poll(()=>visual.evaluate(node=>(node as HTMLElement).style.getPropertyValue('--pull-shift'))).toBe('0px');
  expect(await visual.evaluate(node=>getComputedStyle(node).transitionDuration)).not.toBe('0s');
  await expect(page.locator('.pull-native-indicator')).toHaveCount(0);
});

test('touching an input never triggers the pull gesture', async ({page},testInfo)=>{
  test.skip(testInfo.project.name!=='mobile','Touch-only protection');
  await page.goto('/nibblepot/larder/');
  await page.evaluate(()=>{
    const target=document.querySelector('input[type="search"]')!;
    const make=(y:number)=>new Touch({identifier:7,target,clientX:100,clientY:y});
    target.dispatchEvent(new TouchEvent('touchstart',{bubbles:true,cancelable:true,touches:[make(80)]}));
    target.dispatchEvent(new TouchEvent('touchmove',{bubbles:true,cancelable:true,touches:[make(280)]}));
  });
  await expect(page.locator('.pull-native-indicator')).toHaveCount(0);
  expect(await page.locator('.pull-body').evaluate(node=>(node as HTMLElement).style.getPropertyValue('--pull-shift'))).toBe('0px');
});

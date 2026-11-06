import { expect, test } from '@playwright/test';

for(const width of [320,390,430]) test(`mobile app bar stays visible at ${width}px without covering larder search`,async({page},info)=>{
  test.skip(info.project.name!=='mobile');
  await page.setViewportSize({width,height:800});
  await page.goto('/nibblepot/larder/');
  const header=page.locator('.app-header-shell');
  const initial=await header.boundingBox();
  expect(initial!.height).toBeGreaterThanOrEqual(64);
  await page.evaluate(()=>window.scrollTo(0,900));
  const fixed=await header.boundingBox();
  expect(fixed!.y).toBeCloseTo(0,0);
  expect(fixed!.height).toBe(initial!.height);
  const tools=await page.locator('.larder-tools').boundingBox();
  expect(tools!.y).toBeCloseTo(fixed!.height,0);
  await header.getByRole('button',{name:'Search recipes',exact:true}).click();
  await expect(page).toHaveURL(/\/nibblepot\/$/);
  await expect(page.getByRole('searchbox',{name:'Search recipes',exact:true})).toBeFocused();
  const input=await page.getByRole('searchbox',{name:'Search recipes',exact:true}).boundingBox();
  expect(input!.y).toBeGreaterThanOrEqual(fixed!.height);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
  await header.getByRole('button',{name:'Open favourites',exact:true}).click();
  await expect(page).toHaveURL(/\/nibblepot\/favourites\/$/);
  await expect(page.getByRole('navigation',{name:'Mobile navigation'}).getByRole('button',{name:'More'})).toHaveClass(/active/);
});

test('mobile welcome card stays compact and header does not move with pull gesture',async({page},info)=>{
  test.skip(info.project.name!=='mobile');
  await page.goto('/nibblepot/');
  expect((await page.locator('.hero').boundingBox())!.height).toBeLessThan(260);
  const header=page.locator('.app-header-shell');
  const before=await header.boundingBox();
  await page.evaluate(()=>{
    const target=document.querySelector('.hero')!;
    const touch=(y:number)=>new Touch({identifier:4,target,clientX:140,clientY:y});
    document.dispatchEvent(new TouchEvent('touchstart',{bubbles:true,cancelable:true,touches:[touch(100)]}));
    document.dispatchEvent(new TouchEvent('touchmove',{bubbles:true,cancelable:true,touches:[touch(170)]}));
  });
  await expect(page.locator('.pull-native-indicator')).toBeVisible();
  expect((await header.boundingBox())!.y).toBe(before!.y);
});

test('desktop keeps full navigation and no mobile utility buttons',async({page},info)=>{
  test.skip(info.project.name==='mobile');
  await page.goto('/nibblepot/');
  await expect(page.getByRole('navigation',{name:'Main navigation'})).toBeVisible();
  await expect(page.locator('.mobile-header-actions')).toBeHidden();
});

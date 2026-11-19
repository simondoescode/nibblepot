import { expect, test } from '@playwright/test';

for(const width of [320,390,430]) test(`only Recipes keeps the mobile header at ${width}px`,async({page},info)=>{
  test.skip(info.project.name!=='mobile');
  await page.setViewportSize({width,height:800});
  await page.goto('/nibblepot/');
  const header=page.locator('.app-header-shell');
  if (width === 390) await page.screenshot({path:'test-results/mobile-navigation-recipes.png'});
  await expect(header.getByRole('button',{name:'Simmer home'})).toBeVisible();
  await expect(header.getByRole('button',{name:'Open settings'})).toBeVisible();
  await page.evaluate(()=>window.scrollTo(0,900));
  expect((await header.boundingBox())!.y).toBeCloseTo(0,0);
  const nav=page.getByRole('navigation',{name:'Mobile navigation'});
  for (const label of ['Planner','Larder','Shopping','Favourites']) {
    await nav.getByRole('button',{name:label,exact:true}).click();
    await expect(header).toBeHidden();
    if (width === 390 && label === 'Favourites') await page.screenshot({path:'test-results/mobile-navigation-favourites.png'});
    expect(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--mobile-header-height').trim())).toBe('0px');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
  }
  await nav.getByRole('button',{name:'Recipes',exact:true}).click();
  await header.getByRole('button',{name:'Open settings',exact:true}).click();
  await expect(page).toHaveURL(/\/settings\/$/);
  await expect(header).toBeHidden();
  await page.goto('/nibblepot/');
  await page.getByRole('button',{name:'View recipe',exact:true}).first().click();
  await expect(page).toHaveURL(/\/recipes\//);
  await expect(header).toBeHidden();
  await expect(page.getByRole('button',{name:'Back to recipes',exact:true})).toBeVisible();
});

test('mobile welcome card stays compact and header does not move with pull gesture',async({page},info)=>{
  test.skip(info.project.name!=='mobile');
  await page.goto('/nibblepot/');
  const spotlight = page.locator('.simmer-spotlight');
  const hero = (await spotlight.boundingBox())!;
  const art = (await spotlight.locator('.simmer-spotlight-image').boundingBox())!;
  const title = (await spotlight.getByRole('heading', { level: 1 }).boundingBox())!;
  expect(title.y).toBeGreaterThanOrEqual(art.y + art.height);
  expect(title.y + title.height).toBeLessThan(hero.y + hero.height);
  await expect(spotlight.getByRole('button', { name: 'View recipe' })).toBeInViewport();
  const header=page.locator('.app-header-shell');
  const before=await header.boundingBox();
  await page.evaluate(()=>{
    const target=document.querySelector('.section-heading')!;
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

import { expect, test, type Page } from '@playwright/test';

const navigation = (page:Page, project:string) => page.getByRole('navigation',{name:project==='mobile'?'Mobile navigation':'Main navigation'});

async function pull(page:Page, release=false) {
  await page.evaluate((release) => {
    const target=document.querySelector('.section-heading')!;
    const touch=(y:number)=>new Touch({identifier:91,target,clientX:140,clientY:y});
    document.dispatchEvent(new TouchEvent('touchstart',{bubbles:true,cancelable:true,touches:[touch(80)]}));
    document.dispatchEvent(new TouchEvent('touchmove',{bubbles:true,cancelable:true,touches:[touch(160)]}));
    if(release)document.dispatchEvent(new TouchEvent('touchend',{bubbles:true,touches:[],changedTouches:[touch(160)]}));
  },release);
}

test('tab navigation and recipe Back restore browsing position and larder context',async({page},info)=>{
  test.skip(info.project.name!=='mobile','Scroll continuity is tested with the persistent mobile tab bar');
  await page.goto('/nibblepot/');
  const nav=navigation(page,info.project.name);
  await page.getByRole('button',{name:/30 mins or less/}).click();
  await page.locator('.recipe-card').nth(5).getByRole('link').first().scrollIntoViewIfNeeded();
  const before=await page.evaluate(()=>scrollY);
  const href=await page.locator('.recipe-card').nth(5).getByRole('link').first().getAttribute('href');
  await page.locator('.recipe-card').nth(5).getByRole('link').first().click();
  await expect(page).toHaveURL(new RegExp(href!));
  await page.getByRole('button',{name:'Back to recipes',exact:true}).click();
  await expect(page).toHaveURL(/\/nibblepot\/$/);
  await expect(page.getByRole('button',{name:/30 mins or less/})).toHaveAttribute('aria-pressed','true');
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBeCloseTo(before,0);
  await nav.getByRole('button',{name:'Larder',exact:true}).click();
  await page.getByRole('searchbox',{name:'Search larder ingredients'}).fill('milk');
  await nav.getByRole('button',{name:'Recipes',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBeCloseTo(before,0);
  await nav.getByRole('button',{name:'Larder',exact:true}).click();
  await expect(page.getByRole('searchbox',{name:'Search larder ingredients'})).toHaveValue('milk');
});

test('Back dismisses sheets before navigation and Forward reopens them',async({page})=>{
  await page.goto('/nibblepot/');
  await page.getByRole('button',{name:/Food types/}).click();
  const sheet=page.getByRole('dialog',{name:'Choose food types'});
  await sheet.getByRole('checkbox',{name:'Fish',exact:true}).check();
  await page.goBack();
  await expect(sheet).toHaveCount(0);
  await expect(page).toHaveURL(/\/nibblepot\/$/);
  await expect(page.locator('.recipe-card')).toHaveCount(45);
  await page.goForward();
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole('checkbox',{name:'Fish',exact:true})).not.toBeChecked();
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);
  await expect(page.getByRole('button',{name:/Food types/})).toBeFocused();
});

test('sheet drag dismisses only from its handle; cancelling preserves the sheet',async({page},info)=>{
  test.skip(info.project.name!=='mobile');
  await page.goto('/nibblepot/');
  await page.getByRole('button',{name:/Food types/}).click();
  const sheet=page.getByRole('dialog',{name:'Choose food types'});
  const grip=sheet.getByRole('button',{name:'Close sheet',exact:true});
  await expect(grip).toBeVisible();
  await sheet.evaluate(async el => { await Promise.all(el.getAnimations().map(animation => animation.finished.catch(() => {}))); });
  const box=await grip.boundingBox();
  const x=box!.x+box!.width/2,y=box!.y+box!.height/2;
  await page.mouse.move(x,y);await page.mouse.down();
  await page.mouse.move(x,y+12,{steps:6});await page.mouse.up();
  await expect(sheet).toBeVisible();
  await expect(sheet).toHaveCSS('animation-name','none');
  await sheet.evaluate(async el => { await Promise.all(el.getAnimations().map(animation => animation.finished.catch(() => {}))); });
  const after=await grip.boundingBox();
  await page.mouse.move(after!.x+after!.width/2,after!.y+after!.height/2);await page.mouse.down();
  await page.mouse.move(x,after!.y+120,{steps:8});await page.mouse.up();
  await expect(sheet).toHaveCount(0);
});

test('reduced motion suppresses route, sheet, press and gesture movement and responds to preference changes',async({page},info)=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/nibblepot/');
  if(info.project.name==='mobile'){
    await pull(page);
    await expect(page.locator('.pull-native-indicator')).toBeVisible();
    const initial=await page.locator('.pull-native-indicator').evaluate(el=>getComputedStyle(el).transform);
    await page.evaluate(()=>document.dispatchEvent(new TouchEvent('touchmove',{bubbles:true,cancelable:true,touches:[new Touch({identifier:91,target:document.querySelector('.section-heading')!,clientX:140,clientY:185})]})));
    expect(await page.locator('.pull-native-indicator').evaluate(el=>getComputedStyle(el).transform)).toBe(initial);
    expect(await page.locator('.pull-body').evaluate(el=>getComputedStyle(el).transform)).toBe('none');
    expect(await page.locator('.pull-native-icon svg').evaluate(el=>getComputedStyle(el).transform)).toBe('none');
    await page.evaluate(()=>document.dispatchEvent(new TouchEvent('touchcancel',{touches:[]})));
  }
  await page.getByRole('button',{name:/Food types/}).click();
  const sheet=page.getByRole('dialog',{name:'Choose food types'});
  expect(await sheet.evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
  await page.keyboard.press('Escape');
  await navigation(page,info.project.name).getByRole('button',{name:'Planner',exact:true}).click();
  expect(await page.locator('main').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.getByRole('button',{name:/Change Monday dinner/}).click();
  await expect(page.locator('.motion-sheet')).toHaveCSS('animation-name','sheet-in');
});

test('shopping check marks preserve row position',async({page})=>{
  await page.goto('/nibblepot/');
  await page.evaluate(()=>localStorage.setItem('nibblepot-demo-v1',JSON.stringify({favorites:[],larder:[],shopping:[{id:'pasta',done:false,from:[]},{id:'rice',done:false,from:[]}]})));
  await page.goto('/nibblepot/shopping/');
  const checkbox=page.getByRole('checkbox',{name:'Mark Pasta as purchased',exact:true});
  const before=await checkbox.boundingBox();
  await checkbox.check();
  await expect(checkbox).toBeChecked();
  expect((await checkbox.boundingBox())!.y).toBeCloseTo(before!.y,0);
});

test('direct recipe entry has a safe back fallback; history forward and rapid tab changes agree with URL',async({page},info)=>{
  await page.goto('/nibblepot/recipes/jacket/');
  await page.getByRole('button',{name:'Back to recipes',exact:true}).click();
  await expect(page).toHaveURL(/\/nibblepot\/$/);
  await page.getByRole('link',{name:'Jacket potatoes & beans',exact:true}).click();
  await page.goBack();await expect(page).toHaveURL(/\/nibblepot\/$/);
  await page.goForward();await expect(page.getByRole('heading',{name:'Jacket potatoes & beans',exact:true})).toBeVisible();
  const nav=navigation(page,info.project.name);
  await nav.getByRole('button',{name:'Planner',exact:true}).click();
  await nav.getByRole('button',{name:'Shopping',exact:true}).click();
  await nav.getByRole('button',{name:'Larder',exact:true}).click();
  await expect(page).toHaveURL(/\/nibblepot\/larder\/$/);
  await expect(nav.getByRole('button',{name:'Larder',exact:true})).toHaveAttribute('aria-current','page');
  await expect(page.getByRole('searchbox',{name:'Search larder ingredients'})).toBeVisible();
});

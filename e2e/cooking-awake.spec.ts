import {test,expect} from '@playwright/test';
test('screen-awake opt in requests and releases a wake lock',async({page})=>{
  await page.addInitScript(()=>{
    (window as unknown as Window & {wakeStats?:{requests:number;releases:number}}).wakeStats={requests:0,releases:0};
    Object.defineProperty(navigator,'wakeLock',{configurable:true,value:{request:async()=>{
      const stats=(window as unknown as Window & {wakeStats:{requests:number;releases:number}}).wakeStats;
      stats.requests++;
      return {release:async()=>{stats.releases++;}};
    }}});
  });
  await page.goto('/nibblepot/recipes/tomato-pasta/cook/');
  const toggle=page.getByRole('button',{name:'Keep screen on'});
  await toggle.click();
  await expect(page.getByRole('button',{name:'Screen awake'})).toHaveAttribute('aria-pressed','true');
  await expect.poll(()=>page.evaluate(()=>(window as unknown as Window & {wakeStats:{requests:number}}).wakeStats.requests)).toBe(1);
  await page.getByRole('button',{name:'Screen awake'}).click();
  await expect.poll(()=>page.evaluate(()=>(window as unknown as Window & {wakeStats:{releases:number}}).wakeStats.releases)).toBe(1);
});

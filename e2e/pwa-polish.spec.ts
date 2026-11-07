import {test,expect} from '@playwright/test';
import {readFileSync,existsSync} from 'node:fs';
test('built manifest keeps Simmer branding and supports tablet orientation',()=>{
  const filename='dist/manifest.webmanifest';
  expect(existsSync(filename)).toBe(true);
  const manifest=JSON.parse(readFileSync(filename,'utf8')) as {name:string;orientation:string;display:string;scope:string};
  expect(manifest.name).toBe('Simmer');
  expect(manifest.orientation).toBe('any');
  expect(manifest.display).toBe('standalone');
  expect(manifest.scope).toBe('./');
});
test('landscape tablet does not clip installed-app controls',async({page})=>{
  await page.setViewportSize({width:1024,height:600});
  await page.goto('/nibblepot/');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(1024);
});

import { expect, test } from '@playwright/test';

test('settings lets people read local release history without leaving the app', async ({page}, info) => {
  await page.goto('/nibblepot/');
  const nav = page.getByRole('navigation',{name:info.project.name==='mobile'?'Mobile navigation':'Main navigation'});
  await nav.getByRole('button',{name:'Settings',exact:true}).click();
  await expect(page.getByText('v0.2.0',{exact:true})).toBeVisible();
  const notes = page.getByRole('region',{name:'Release notes'});
  await expect(notes.getByRole('button',{name:/What.s new/})).toBeVisible();
  await notes.getByRole('button',{name:/What.s new/}).click();
  await expect(notes.getByText('Our first helping')).toBeVisible();
  await expect(notes.getByText('v0.2.0',{exact:true})).toBeVisible();
});

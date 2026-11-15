import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version: string };

test('settings lets people read local release history without leaving the app', async ({page}, info) => {
  await page.goto('/nibblepot/');
  if (info.project.name === 'mobile') {
    await page.getByRole('button',{name:'Open settings'}).click();
  } else {
    await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:'Settings',exact:true}).click();
  }

  await expect(page.locator('.settings-version')).toHaveText(`v${version}`);
  const notes = page.getByRole('region',{name:'Release notes'});
  const toggle = notes.getByRole('button',{name:/What.s new/});
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded','false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded','true');
  await expect(notes.locator('.release-note-entry').first().locator('.release-note-meta span').first()).toHaveText(`v${version}`);
  await expect(notes.getByText('Our first helping')).toBeVisible();
  await expect(notes.getByText('v0.2.0',{exact:true})).toBeVisible();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded','false');
});

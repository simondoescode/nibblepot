import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('shopping share has a static noindex route', () => {
  expect(readFileSync('dist/shopping/shared/index.html', 'utf8')).toContain('noindex,follow');
});

test('a compressed shopping snapshot opens in another browser with quantities and independent persistent ticks', async ({ page, browser }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (value: string) => { (window as unknown as { copied: string }).copied = value; } } }));
  await page.goto('/nibblepot/shopping/');
  await page.evaluate(() => localStorage.setItem('nibblepot-demo-v1', JSON.stringify({
    favorites: [], larder: ['pasta'], shopping: [
      { id: 'pasta', from: ['tomato-pasta'], done: false },
      { id: 'milk', from: [], done: true },
      { id: 'custom:café crème', customName: 'Café crème', from: [], done: false },
    ], servings: { 'tomato-pasta': 2 }, larderQuantities: { pasta: '100 g' },
  })));
  await page.reload();
  await page.getByRole('button', { name: 'Share shopping list', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Share shopping list', exact: true });
  const link = await dialog.getByRole('textbox', { name: 'Shopping list share link', exact: true }).inputValue();
  expect(link).toContain('/shopping/shared/#list=z.');
  await dialog.getByRole('button', { name: 'Copy link', exact: true }).click();
  expect(await page.evaluate(() => (window as unknown as { copied: string }).copied)).toBe(link);
  const senderBefore = await page.evaluate(() => localStorage.getItem('nibblepot-demo-v1'));

  const recipient = await browser.newContext({ baseURL: new URL(page.url()).origin });
  const other = await recipient.newPage();
  await other.goto('/nibblepot/shopping/');
  await other.evaluate(() => localStorage.setItem('nibblepot-demo-v1', JSON.stringify({ favorites: ['jacket'], larder: [], shopping: [{ id: 'baked-beans', from: [], done: false }] })));
  await other.reload();
  const before = await other.evaluate(() => localStorage.getItem('nibblepot-demo-v1'));
  await other.goto(link);
  await expect(other.getByRole('heading', { name: 'A shared shopping list', exact: true })).toBeVisible();
  await expect(other.locator('.shop-row')).toHaveCount(3);
  await expect(other.locator('.shop-row').filter({ hasText: 'Pasta' })).toContainText('75 g');
  await expect(other.getByRole('checkbox', { name: 'Mark Milk as purchased', exact: true })).toBeChecked();
  await expect(other.getByRole('checkbox', { name: 'Mark Café crème as purchased', exact: true })).not.toBeChecked();
  await other.getByRole('checkbox', { name: 'Mark Pasta as purchased', exact: true }).check();
  await expect(other.locator('.shopping-summary [role="status"]')).toContainText('1 to buy');
  await other.reload();
  await expect(other.getByRole('checkbox', { name: 'Mark Pasta as purchased', exact: true })).toBeChecked();
  expect(await other.evaluate(() => localStorage.getItem('nibblepot-demo-v1'))).toBe(before);
  expect(await page.evaluate(() => localStorage.getItem('nibblepot-demo-v1'))).toBe(senderBefore);
  await other.getByRole('button', { name: 'Open my shopping list', exact: true }).click();
  await expect(other.locator('.shop-row')).toHaveCount(1);
  await expect(other.locator('.shop-row')).toContainText('Baked beans');
  await recipient.close();
});

test('shopping links support native sharing, clipboard fallback, and a 320px checklist', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('denied'); } } });
    Object.defineProperty(navigator, 'share', { configurable: true, value: async (data: ShareData) => { (window as unknown as { shared: string }).shared = data.url!; } });
  });
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/nibblepot/shopping/');
  await page.evaluate(() => localStorage.setItem('nibblepot-demo-v1', JSON.stringify({ favorites: [], larder: [], shopping: [{ id: 'pasta', done: false, from: ['tomato-pasta'] }] })));
  await page.reload();
  await page.getByRole('button', { name: 'Share shopping list', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Share shopping list', exact: true });
  const input = dialog.getByRole('textbox', { name: 'Shopping list share link', exact: true });
  const link = await input.inputValue();
  await dialog.getByRole('button', { name: 'Share link', exact: true }).click();
  expect(await page.evaluate(() => (window as unknown as { shared: string }).shared)).toBe(link);
  await dialog.getByRole('button', { name: 'Copy link', exact: true }).click();
  await expect(input).toBeFocused();
  await expect(dialog.getByRole('status')).toHaveText('Select and copy the link below.');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Share shopping list', exact: true })).toBeFocused();
  await page.goto(link);
  await expect(page.getByRole('checkbox', { name: 'Mark Pasta as purchased', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
});

test('incomplete shopping links recover and empty lists offer no share action', async ({ page }) => {
  await page.goto('/nibblepot/shopping/shared/#list=z.broken');
  await expect(page.getByRole('heading', { name: 'This shopping link isn’t complete' })).toBeVisible();
  await page.getByRole('button', { name: 'Open my shopping list', exact: true }).click();
  await expect(page).toHaveURL(/\/shopping\/$/);
  await expect(page.getByRole('button', { name: 'Share shopping list', exact: true })).toHaveCount(0);
});

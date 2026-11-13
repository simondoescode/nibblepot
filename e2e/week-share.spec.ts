import { expect, test } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';

test('shared week has a static, noindex Pages entrypoint', () => {
  expect(existsSync('dist/planner/shared/index.html')).toBe(true);
  expect(readFileSync('dist/planner/shared/index.html', 'utf8')).toContain('noindex,follow');
});

test('share the selected week, open in another browser, refresh and return from a recipe without changing saved plans', async ({ page, browser }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async (value: string) => { (window as unknown as { copied: string }).copied = value; } }, configurable: true });
  });
  await page.goto('/nibblepot/planner/');
  await page.getByRole('button', { name: 'Next week', exact: true }).click();
  const weekLabel = await page.locator('.planner-week-range strong').textContent();
  await page.getByRole('button', { name: 'Change Monday dinner', exact: true }).click();
  await page.getByRole('button', { name: 'Clear night', exact: true }).click();
  await page.getByRole('button', { name: 'Share week', exact: true }).click();
  const share = page.getByRole('dialog', { name: 'Share this week', exact: true });
  const link = await share.getByRole('textbox', { name: 'Week share link', exact: true }).inputValue();
  await share.getByRole('button', { name: 'Copy link', exact: true }).click();
  await expect(share.getByRole('status')).toHaveText('Link copied. Ready to send.');
  expect(await page.evaluate(() => (window as unknown as { copied: string }).copied)).toBe(link);
  await share.getByRole('button', { name: 'Close sharing', exact: true }).click();
  await page.getByRole('button', { name: 'Share week', exact: true }).click();
  expect(await page.getByRole('textbox', { name: 'Week share link' }).inputValue()).not.toBe(link);

  const recipient = await browser.newContext({ baseURL: new URL(page.url()).origin });
  const other = await recipient.newPage();
  await other.goto('/nibblepot/');
  await other.evaluate(() => localStorage.setItem('nibblepot-demo-v1', JSON.stringify({ larder: ['pasta'], favorites: ['jacket'], shopping: [], weekPlans: { '2026-11-09': Array.from({ length: 7 }, () => ({ kind: 'freezer' })) } })));
  await other.reload();
  const before = await other.evaluate(() => localStorage.getItem('nibblepot-demo-v1'));
  await other.goto(link);
  await expect(other.getByRole('heading', { name: 'A shared week of dinners' })).toBeVisible();
  await expect(other.locator('.planner-intro p')).toHaveText(weekLabel!);
  await expect(other.locator('.planner-day').first()).toContainText('No dinner planned');
  await expect(other.locator('.planner-day')).toHaveCount(7);
  await other.reload();
  await expect(other.locator('.planner-day').first()).toContainText('No dinner planned');
  await other.getByRole('button', { name: 'View recipe for Tuesday', exact: true }).click();
  await expect(other.locator('.recipe-page h1')).toHaveText('One-pot chicken rice');
  await other.getByRole('button', { name: 'Back to recipes', exact: true }).click();
  await expect(other).toHaveURL(link);
  await expect(other.getByRole('heading', { name: 'A shared week of dinners' })).toBeVisible();
  expect(await other.evaluate(() => localStorage.getItem('nibblepot-demo-v1'))).toBe(before);
  await recipient.close();
});

test('copy failure offers selectable link, Escape restores focus and mobile layout fits', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => { throw new Error('denied'); } }, configurable: true }));
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/nibblepot/planner/');
  await page.getByRole('button', { name: 'Share week', exact: true }).click();
  const share = page.getByRole('dialog', { name: 'Share this week', exact: true });
  await share.getByRole('button', { name: 'Copy link', exact: true }).click();
  const input = share.getByRole('textbox', { name: 'Week share link' });
  await expect(input).toBeFocused();
  await expect(share.getByRole('status')).toHaveText('Select and copy the link below.');
  const link = await input.inputValue();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  const bounds = await share.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(321);
  await page.keyboard.press('Escape');
  await expect(share).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Share week', exact: true })).toBeFocused();
  await page.goto(link);
  await expect(page.locator('.planner-day')).toHaveCount(7);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
});

test('broken links show a recovery message and leave saved plans alone', async ({ page }) => {
  await page.goto('/nibblepot/');
  const before = await page.evaluate(() => localStorage.getItem('nibblepot-demo-v1'));
  await page.goto('/nibblepot/planner/shared/#plan=broken');
  await expect(page.getByRole('heading', { name: 'This week link isn’t complete' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('nibblepot-demo-v1'))).toBe(before);
  await page.getByRole('button', { name: 'Open my planner', exact: true }).click();
  await expect(page).toHaveURL(/\/planner\/$/);
});

test('native sharing receives the same snapshot URL and cancellation leaves it available', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'share', { configurable: true, value: async (data: ShareData) => {
    (window as unknown as { sharedUrl: string }).sharedUrl = data.url!;
    throw new DOMException('Cancelled', 'AbortError');
  } }));
  await page.goto('/nibblepot/planner/');
  await page.getByRole('button', { name: 'Share week', exact: true }).click();
  const link = await page.getByRole('textbox', { name: 'Week share link' }).inputValue();
  await page.getByRole('button', { name: 'Share link', exact: true }).click();
  expect(await page.evaluate(() => (window as unknown as { sharedUrl: string }).sharedUrl)).toBe(link);
  await expect(page.getByRole('dialog', { name: 'Share this week' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy link', exact: true })).toBeEnabled();
});

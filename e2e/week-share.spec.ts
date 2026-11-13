import { expect, test } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';

async function sharedWeekLink(page: import('@playwright/test').Page) {
  await page.goto('/nibblepot/planner/');
  await page.getByRole('button', { name: 'Share week', exact: true }).click();
  return page.getByRole('textbox', { name: 'Week share link', exact: true }).inputValue();
}

test('shared dinners stay readable and import controls remain above the mobile navigation', async ({ page }, testInfo) => {
  const link = await sharedWeekLink(page);
  for (const width of [320, 390, 768, 1024, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(link);
    const title = page.locator('.shared-week-meal .planner-picked strong').first();
    expect((await title.boundingBox())!.width).toBeGreaterThan(100);
    expect((await page.locator('.shared-week-day').first().boundingBox())!.height).toBeLessThan(200);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    await expect(page.getByRole('checkbox', { name: 'Also update my shopping list', exact: true })).not.toBeChecked();
    const action = page.getByRole('button', { name: 'Update my planner', exact: true });
    const before = await action.boundingBox();
    if (width === 390 || width === 1280) await page.screenshot({ path: `test-results/shared-week-${testInfo.project.name}-${width}.png` });
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const after = await action.boundingBox();
    expect(Math.abs(before!.y - after!.y)).toBeLessThan(1);
    const bar = await page.locator('.shared-week-actions').boundingBox();
    const lastRow = await page.locator('.shared-week-day').last().boundingBox();
    expect(lastRow!.y + lastRow!.height).toBeLessThanOrEqual(bar!.y);
    if (width <= 1180) {
      const nav = await page.locator('.mobile-nav').boundingBox();
      expect(bar!.y + bar!.height).toBeLessThanOrEqual(nav!.y + 1);
    }
  }
});

test('update my planner imports the dated week without changing shopping unless chosen', async ({ page }) => {
  const link = await sharedWeekLink(page);
  const seed = { larder: ['potatoes'], favorites: ['jacket'], servings: { jacket: 6 },
    shopping: [{ id: 'pasta', done: true, from: [] }, { id: 'eggs', done: false, from: [] }],
    weekPlans: { '2026-11-02': Array.from({ length: 7 }, () => ({ kind: 'freezer' })) } };
  for (const updateShopping of [false, true]) {
    await page.goto('/nibblepot/');
    await page.evaluate(value => localStorage.setItem('nibblepot-demo-v1', JSON.stringify(value)), seed);
    await page.goto(link);
    await expect(page.locator('.mobile-nav .mobbtn.active')).toContainText('Planner');
    const week = await page.locator('.planner-intro p').textContent();
    if (updateShopping) await page.getByRole('checkbox', { name: 'Also update my shopping list', exact: true }).check();
    await page.getByRole('button', { name: 'Update my planner', exact: true }).click();
    await expect(page).toHaveURL(/\/planner\/$/);
    await expect(page.locator('.planner-week-range strong')).toHaveText(week!);
    await expect(page.locator('.shared-week-actions')).toHaveCount(0);
    await expect(page.locator('.planner-day').first()).toContainText('Jacket potatoes');
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('nibblepot-demo-v1')!));
    expect(saved.favorites).toEqual(seed.favorites);
    expect(saved.larder).toEqual(seed.larder);
    expect(saved.servings).toEqual(seed.servings);
    expect(saved.weekPlans['2026-11-02']).toEqual(seed.weekPlans['2026-11-02']);
    if (!updateShopping) expect(saved.shopping).toEqual(seed.shopping);
    else {
      expect(saved.shoppingPlan).toBeDefined();
      expect(saved.shopping.find((item: { id: string }) => item.id === 'pasta').done).toBe(true);
      expect(saved.shopping.some((item: { id: string }) => item.id === 'potatoes')).toBe(false);
      expect(saved.shopping.some((item: { id: string }) => item.id === 'baked-beans')).toBe(true);
    }
    await page.reload();
    await expect(page.locator('.planner-day').first()).toContainText('Jacket potatoes');
  }
});

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
  expect(link).toContain('#plan=z.');
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

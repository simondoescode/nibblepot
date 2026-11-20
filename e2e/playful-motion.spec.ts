import { expect, test, type Locator } from '@playwright/test';

// Pause JS feedback so interruption assertions do not depend on catching a 240ms frame.
// CSS navigation/sheet lifecycles continue normally.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      const animation = animate.apply(this, args);
      animation.pause();
      return animation;
    };
  });
});
const effects = (element: Locator) => element.evaluate(node =>
  node.getAnimations({ subtree: true }).filter(animation => animation.id.startsWith('simmer-')).map(animation => animation.id));

test('favourite feedback cancels on rapid removal, replays on save and never on restored state', async ({ page }) => {
  await page.goto('/nibblepot/');
  const heart = page.locator('.heart').first();
  await expect(heart).toHaveAttribute('aria-pressed', 'false');
  expect(await effects(heart)).toEqual([]);
  // Keep the real control mounted; finish state is immediate even while feedback is paused.
  await heart.dispatchEvent('click');
  await expect(heart).toHaveAttribute('aria-pressed', 'true');
  expect(await effects(heart)).toContain('simmer-pop');
  await heart.dispatchEvent('click');
  await expect(heart).toHaveAttribute('aria-pressed', 'false');
  expect(await effects(heart)).toEqual([]);
  await heart.dispatchEvent('click');
  expect(await effects(heart)).toContain('simmer-pop');
  await page.reload();
  await expect(heart).toHaveAttribute('aria-pressed', 'true');
  expect(await effects(heart)).toEqual([]);
});

test('changing motion preference cancels active sparks and subsequent actions still work', async ({ page }) => {
  await page.goto('/nibblepot/');
  const heart = page.locator('.heart').first();
  await heart.dispatchEvent('click');
  expect(await effects(heart)).toContain('simmer-spark');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => effects(heart)).toEqual([]);
  await heart.dispatchEvent('click');
  await heart.dispatchEvent('click');
  await expect(heart).toHaveAttribute('aria-pressed', 'true');
  expect(await effects(heart)).toEqual([]);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  // Restoring the preference must not replay an old action.
  expect(await effects(heart)).toEqual([]);
  await heart.dispatchEvent('click');
  await heart.dispatchEvent('click');
  expect(await effects(heart)).toContain('simmer-pop');
});

test('cooking celebration runs once after finishing, but not after restoring a completed session', async ({ page }) => {
  await page.goto('/nibblepot/recipes/speedy-tomato-pasta/cook/');
  await page.getByRole('button', { name: 'Next step', exact: true }).click();
  await page.getByRole('button', { name: 'Next step', exact: true }).click();
  await page.getByRole('button', { name: 'Finish cooking', exact: true }).click();
  await expect(page.getByRole('heading', { name: "Dinner's ready!" })).toBeVisible();
  expect(await effects(page.locator('.cooking-complete-mark'))).toContain('simmer-celebrate');
  await page.reload();
  await expect(page.getByRole('heading', { name: "Dinner's ready!" })).toBeVisible();
  expect(await effects(page.locator('.cooking-complete-mark'))).toEqual([]);
});

test('planner placement responds to repeated changes while Undo restores the final plan', async ({ page }) => {
  await page.goto('/nibblepot/planner/');
  const monday = page.locator('.planner-day').first();
  const before = await monday.locator('.planner-picked strong').innerText();
  await page.getByRole('button', { name: 'Change Monday dinner', exact: true }).click();
  await page.getByRole('button', { name: 'Freezer / easy', exact: true }).click();
  await expect(monday).toContainText('Freezer');
  expect(await effects(monday)).toContain('simmer-stamp');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(monday.locator('.planner-picked strong')).toHaveText(before);
  // An old placement must not continue after Undo.
  expect(await effects(monday)).toEqual([]);
});

for (const width of [360, 390, 820, 1180, 1440]) {
  test(`playful feedback keeps the layout stable at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/nibblepot/');
    const hero = page.getByRole('region', { name: "Tonight's dinner" });
    const plan = hero.getByRole('button', {name:'Plan tonight'});
    await plan.click();
    await page.getByRole('button', {name:'Close dinner picker'}).click();
    await expect(plan).toBeFocused();
    await page.screenshot({ path: info.outputPath(`motion-${width}-normal.png`) });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect.poll(() => effects(hero)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath(`motion-${width}-reduced.png`) });
  });
}

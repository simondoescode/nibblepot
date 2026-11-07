import { test, expect, type Page } from '@playwright/test';

async function touchGesture(page: Page) {
  const session = await page.context().newCDPSession(page);
  return (type: 'touchStart' | 'touchMove' | 'touchEnd' | 'touchCancel', x = 0, y = 104) =>
    session.send('Input.dispatchTouchEvent', {
      type,
      touchPoints: type === 'touchEnd' || type === 'touchCancel' ? [] : [{ x, y }],
    });
}

test.describe('Swipe between mobile tabs', () => {
  test.skip(({ isMobile }) => !isMobile);

  test('shows the neighbouring page in either direction before committing', async ({ page }) => {
    await page.goto('/nibblepot/planner/');
    const main = page.locator('#main-content');
    await expect(main.getByRole('heading', { name: "This week's tea." })).toBeVisible();
    const touch = await touchGesture(page);
    const preview = page.locator('.swipe-preview');

    await touch('touchStart', 170);
    await touch('touchMove', 40);
    await expect(preview).toContainText('Your larder');
    await expect(preview).toHaveAttribute('inert', '');
    await expect(page.getByRole('heading', { name: 'Your larder' })).toHaveCount(0);
    const bounds = await preview.boundingBox();
    expect(bounds!.x).toBeLessThan(page.viewportSize()!.width);
    expect(bounds!.x).toBeGreaterThan(page.viewportSize()!.width / 2);
    await expect(page).toHaveURL(/\/planner\/$/);

    await touch('touchMove', 300);
    await expect(preview).toContainText("This week's dinners");
    expect((await preview.boundingBox())!.x).toBeLessThan(0);
    await expect(page).toHaveURL(/\/planner\/$/);
    await touch('touchEnd');

    await expect(page).toHaveURL(/\/nibblepot\/$/);
    await expect(main.getByRole('heading', { name: "This week's dinners" })).toBeVisible();
    await expect(main).toHaveAttribute('data-motion', 'swipe');
    await expect(preview).toHaveCount(0);
    await page.goBack();
    await expect(main.getByRole('heading', { name: "This week's tea." })).toBeVisible();
  });

  test('swipes from a Planner meal card into the same Recipes page it previews', async ({ page }) => {
    await page.addInitScript(() => { Math.random = () => 0.01; });
    await page.goto('/nibblepot/planner/');
    const meal = page.getByRole('button', { name: 'Change Monday dinner' });
    await expect(meal).toBeInViewport();
    const card = (await meal.boundingBox())!;
    const x = card.x + 20;
    const y = card.y + card.height / 2;
    const touch = await touchGesture(page);

    await touch('touchStart', x, y);
    await touch('touchMove', x + 145, y);
    const preview = page.locator('.swipe-preview');
    await expect(preview).toContainText("This week's dinners");
    const title = await preview.locator('h1').innerText();
    await page.evaluate(() => { Math.random = () => 0.99; });
    await touch('touchEnd');

    await expect(page).toHaveURL(/\/nibblepot\/$/);
    await expect(page.locator('#main-content h1')).toHaveText(title);
    await expect(page.locator('.swipe-track')).toHaveCSS('transform', 'none');
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await touch('touchStart', 290);
    await touch('touchMove', 80);
    await touch('touchEnd');
    await expect(page).toHaveURL(/\/planner\/$/);
    await meal.tap();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('returns to the current tab after a short swipe', async ({ page }) => {
    await page.goto('/nibblepot/planner/');
    await expect(page.locator('#main-content h2').first()).toHaveText("This week's tea.");
    const touch = await touchGesture(page);
    await touch('touchStart', 170);
    await touch('touchMove', 140);
    await expect(page.locator('.swipe-preview')).toContainText('Your larder');
    await touch('touchEnd');

    await expect(page.locator('.swipe-preview')).toHaveCount(0);
    await expect(page.locator('.swipe-track')).toHaveCSS('transform', 'none');
    await expect(page).toHaveURL(/\/planner\/$/);
  });

  test('keeps page gutters and settles through repeated swipes', async ({ page }) => {
    await page.goto('/nibblepot/planner/');
    const main = page.locator('#main-content');
    const track = page.locator('.swipe-track');
    const preview = page.locator('.swipe-preview');
    const touch = await touchGesture(page);
    const routes = [
      { path: 'larder', heading: 'Your larder', start: 290, end: 80 },
      { path: 'shopping', heading: 'Shopping, sorted.', start: 290, end: 80 },
      { path: 'larder', heading: 'Your larder', start: 80, end: 290 },
      { path: 'planner', heading: "This week's tea.", start: 80, end: 290 },
    ];

    for (const { path, heading, start, end } of routes) {
      await touch('touchStart', start);
      await touch('touchMove', end);
      await expect(preview).toContainText(heading);
      await expect(page.locator('.larder-meals-bar')).toHaveCount(0);

      const pane = (await preview.boundingBox())!;
      const previewHeading = (await preview.locator('h2').first().boundingBox())!;
      expect(pane.width).toBeCloseTo(page.viewportSize()!.width, 0);
      const gutter = previewHeading.x - pane.x;
      expect(gutter).toBeGreaterThan(0);
      await touch('touchEnd');

      await expect(page).toHaveURL(new RegExp('/' + path + '/$'));
      await expect(preview).toHaveCount(0);
      await expect(track).toHaveCSS('transform', 'none');
      const title = main.getByRole('heading', { name: heading, exact: true });
      await expect(title).toBeFocused();
      await expect(title).toHaveCSS('outline-style', 'none');
      expect((await title.boundingBox())!.x).toBeCloseTo(gutter, 0);
      await expect(page.locator('.larder-meals-bar')).toHaveCount(path === 'larder' ? 1 : 0);
    }

    await page.getByRole('navigation', { name: 'Mobile navigation' })
      .getByRole('button', { name: 'Shopping' }).tap();
    const shopping = main.getByRole('heading', { name: 'Shopping, sorted.' });
    await expect(shopping).toBeFocused();
    await expect(shopping).toHaveCSS('outline-style', 'none');
  });

  test('a new swipe can interrupt a short swipe snapping back', async ({ page }) => {
    await page.goto('/nibblepot/planner/');
    const touch = await touchGesture(page);
    const track = page.locator('.swipe-track');
    await touch('touchStart', 170);
    await touch('touchMove', 140);
    await touch('touchEnd');
    // Hold the rebound in progress to exercise the same race on slow devices and CI.
    await track.evaluate(node => node.getAnimations().forEach(animation => animation.pause()));
    await touch('touchStart', 290);
    await touch('touchMove', 80);
    await touch('touchEnd');
    await expect(page).toHaveURL(/\/larder\/$/);
    await expect(track).toHaveCSS('transform', 'none');
  });

  test('switches without sliding when reduced motion is enabled', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/nibblepot/planner/');
    await expect(page.locator('#main-content h2').first()).toHaveText("This week's tea.");
    const touch = await touchGesture(page);
    await touch('touchStart', 270);
    await touch('touchMove', 80);
    await expect(page.locator('.swipe-preview')).toHaveCount(0);
    await expect(page.locator('.swipe-track')).toHaveCSS('transform', 'none');
    await touch('touchEnd');
    await expect(page).toHaveURL(/\/larder\/$/);
  });
});

test('touch tablets preview Recipes, settle across repeated swipes and leave edge gestures alone', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Touch tablet simulation');
  await page.setViewportSize({ width: 834, height: 1112 });
  await page.goto('/nibblepot/planner/');
  const touch = await touchGesture(page);
  const preview = page.locator('.swipe-preview');

  await touch('touchStart', 12);
  await touch('touchMove', 310);
  await expect(preview).toHaveCount(0);
  await touch('touchEnd');
  await expect(page).toHaveURL(/\/planner\/$/);

  for (const [start, end, path, heading] of [
    [180, 480, '/nibblepot/', "This week's dinners"],
    [480, 180, '/nibblepot/planner/', "This week's tea."],
  ] as const) {
    await touch('touchStart', start);
    await touch('touchMove', end);
    await expect(preview).toContainText(heading);
    await touch('touchEnd');
    await expect(page).toHaveURL(url => url.pathname === path);
    await expect(preview).toHaveCount(0);
    await expect(page.locator('.swipe-track')).toHaveCSS('transform', 'none');
  }

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await touch('touchStart', 480);
  await touch('touchMove', 180);
  await expect(preview).toHaveCount(0);
  await touch('touchEnd');
  await expect(page).toHaveURL(/\/larder\/$/);
});

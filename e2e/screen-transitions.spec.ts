import { test, expect } from '@playwright/test';

test.describe('Screen transitions', () => {
  test('tab entry uses a short fade without moving the app shell', async ({ page }) => {
    await page.goto('/nibblepot/');
    const main = page.locator('#main-content');
    await expect(main).toBeVisible();
    const styles = await main.evaluate(el => {
      const css = getComputedStyle(el);
      return { overflowX: css.overflowX, animation: css.animationName };
    });
    expect(styles.overflowX).toBe('clip');
    expect(styles.animation).not.toContain('infinite');
  });

  test('reduced motion disables route movement', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/nibblepot/');
    const main = page.locator('#main-content');
    await expect(main).toBeVisible();
    const result = await main.evaluate(el => {
      el.setAttribute('data-motion', 'forward');
      const css = getComputedStyle(el);
      return { animation: css.animationName, transform: css.transform, opacity: css.opacity };
    });
    expect(result.animation).toBe('none');
    expect(result.transform).toBe('none');
    expect(result.opacity).toBe('1');
  });
});

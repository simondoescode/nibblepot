import { test, expect } from '@playwright/test';

test.describe('Issue #31: installed-PWA release smoke', () => {
  test('manifest and install assets resolve under the app scope', async ({ page, request }) => {
    await page.goto('/nibblepot/');
    const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(manifestHref, 'page must expose an install manifest').toBeTruthy();
    const manifestUrl = new URL(manifestHref!, page.url());
    const response = await request.get(manifestUrl.toString());
    expect(response.ok()).toBeTruthy();
    const manifest = await response.json();
    expect(manifest.name || manifest.short_name).toBeTruthy();
    expect(manifest.display).toMatch(/standalone|minimal-ui|fullscreen/);
    const scope = new URL(manifest.scope || './', manifestUrl);
    const start = new URL(manifest.start_url || './', manifestUrl);
    expect(start.pathname.startsWith(scope.pathname)).toBeTruthy();
    expect(scope.pathname.startsWith('/nibblepot/')).toBeTruthy();
    expect(Array.isArray(manifest.icons) && manifest.icons.length > 0).toBeTruthy();
    for (const icon of manifest.icons) {
      const iconResponse = await request.get(new URL(icon.src, manifestUrl).toString());
      expect(iconResponse.ok(), `PWA icon missing: ${icon.src}`).toBeTruthy();
      expect((await iconResponse.body()).length).toBeGreaterThan(100);
    }
  });

  test('mobile shell remains inside viewport after resize and history navigation', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile viewport only');
    await page.goto('/nibblepot/');
    for (const width of [320, 390, 430]) {
      await page.setViewportSize({ width, height: 780 });
      await expect.poll(() => page.evaluate(() =>
        document.documentElement.scrollWidth <= window.innerWidth + 1
      )).toBeTruthy();
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.goBack().catch(() => null);
      await expect.poll(() => page.evaluate(() =>
        document.documentElement.scrollWidth <= window.innerWidth + 1
      )).toBeTruthy();
    }
  });

  test('reduced motion can be toggled at runtime without horizontal overflow', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile viewport only');
    await page.goto('/nibblepot/');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect.poll(() => page.evaluate(() =>
      matchMedia('(prefers-reduced-motion: reduce)').matches
    )).toBeTruthy();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect.poll(() => page.evaluate(() =>
      !matchMedia('(prefers-reduced-motion: reduce)').matches
    )).toBeTruthy();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
  });
});

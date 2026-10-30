import { expect, test } from '@playwright/test';

test('recipe catalogue illustrations load on mobile and desktop', async ({ page }) => {
  await page.goto('/nibblepot/');
  await expect(page.locator('.recipe-card')).toHaveCount(16);
  const art = page.locator('.recipe-card .recipe-illustration');
  await expect(art).toHaveCount(16);
  await expect(art.first()).toHaveAttribute('src', /\/nibblepot\/recipes\/jacket\.svg/);
  await art.first().scrollIntoViewIfNeeded();
  await expect.poll(() => art.first().evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await page.locator('.recipe-card').first().getByRole('button', { name: /view jacket/i }).first().click();
  const dialog = page.getByRole('dialog', { name: /recipe:/i });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.recipe-illustration')).toHaveCount(1);
  await expect(dialog.locator('.recipe-detail-panel')).toHaveCount(2);
  await expect(dialog.getByRole('heading', { name: /let's make it/i })).toBeVisible();
  await dialog.getByRole('button', { name: 'Close dialog' }).click();
  await expect(dialog).toHaveCount(0);
});

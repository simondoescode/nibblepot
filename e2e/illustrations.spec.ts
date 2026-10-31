import { expect, test } from '@playwright/test';

test('recipe catalogue illustrations load on mobile and desktop', async ({ page }) => {
  await page.goto('/nibblepot/');
  await expect(page.locator('.recipe-card')).toHaveCount(16);
  const art = page.locator('.recipe-card .recipe-illustration');
  await expect(art).toHaveCount(16);
  await expect(art.first()).toHaveAttribute('src', /\/nibblepot\/recipes\/jacket\.webp/);
  await expect(page.locator('.recipe-card img.recipe-photo')).toHaveCount(15);
  await expect(page.locator('.recipe-card .recipe-illustration[src$="/recipes/traybake.svg"]')).toHaveCount(1);
  await art.first().scrollIntoViewIfNeeded();
  await expect.poll(() => art.first().evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await page.locator('.recipe-card').first().getByRole('link', { name: /view jacket/i }).click();
  const recipe = page.locator('.recipe-page');
  await expect(recipe).toBeVisible();
  await expect(recipe.locator('.recipe-page-image img')).toHaveCount(1);
  await expect(recipe.locator('.recipe-detail-panel')).toHaveCount(2);
  await expect(recipe.getByRole('heading', { name: /let's make it/i })).toBeVisible();
  await recipe.getByRole('button', { name: /back to recipes/i }).click();
  await expect(recipe).toHaveCount(0);
});


test('generated WebP images load with transparent corners', async ({ page }) => {
  await page.goto('/nibblepot/');
  const photo = page.locator('.recipe-card img.recipe-photo').first();
  await photo.scrollIntoViewIfNeeded();
  await expect.poll(() => photo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth === 800)).toBe(true);
  const cornerAlpha = await photo.evaluate((img: HTMLImageElement) => {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas missing');
    ctx.drawImage(img, 0, 0);
    return [ctx.getImageData(0, 0, 1, 1).data[3], ctx.getImageData(799, 503, 1, 1).data[3]];
  });
  expect(cornerAlpha).toEqual([0, 0]);
});

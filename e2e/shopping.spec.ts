import { expect, test } from '@playwright/test';

test('shopping rows toggle by name and the To buy filter tracks remaining items', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('nibblepot-demo-v1')) {
      localStorage.setItem('nibblepot-demo-v1', JSON.stringify({
        favorites: [], larder: [],
        shopping: [{ id: 'pasta', done: false, from: [] }, { id: 'rice', done: true, from: [] }],
      }));
    }
  });
  await page.goto('/nibblepot/shopping/');

  const shopping = page.getByRole('main');
  const pasta = shopping.getByRole('checkbox', { name: 'Mark Pasta as purchased' });
  const rice = shopping.getByRole('checkbox', { name: 'Mark Rice as purchased' });
  const nav = page.getByRole('navigation', { name: testInfo.project.name === 'mobile' ? 'Mobile navigation' : 'Main navigation' });
  const badge = nav.getByRole('button', { name: 'Shopping' }).locator('.mob-count, .nav-count');
  await expect(badge).toHaveText('1');
  await expect(rice).toBeChecked();

  await shopping.getByRole('button', { name: 'To buy', exact: true }).click();
  await expect(rice).toHaveCount(0);
  await expect(shopping.getByRole('link', { name: 'Find Pasta at Tesco' })).toHaveAttribute('href', /tesco\.com/);
  await shopping.getByText('Pasta', { exact: true }).click();
  await expect(shopping.getByRole('status')).toContainText('0 to buy');
  await expect(shopping.getByRole('heading', { name: 'Everything’s ticked off' })).toBeVisible();
  await expect(badge).toHaveCount(0);

  await shopping.getByRole('button', { name: 'Show all items' }).click();
  await expect(pasta).toBeChecked();
  await page.reload();
  await expect(pasta).toBeChecked();
  await shopping.getByRole('button', { name: 'Remove ticked items' }).click();
  await expect(shopping.getByRole('heading', { name: 'Your list is empty' })).toBeVisible();
});

test('two-digit shopping count fits the mobile tab badge', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile-only badge');
  await page.setViewportSize({ width: 320, height: 640 });
  await page.addInitScript(() => {
    const ids = ['potatoes', 'baked-beans', 'rice', 'pasta', 'chopped-tomatoes', 'onion',
      'garlic', 'stock', 'paprika', 'gravy', 'wraps', 'bread'];
    localStorage.setItem('nibblepot-demo-v1', JSON.stringify({
      favorites: [], larder: [], shopping: ids.map(id => ({ id, done: false, from: [] })),
    }));
  });
  await page.goto('/nibblepot/shopping/');

  const tab = page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('button', { name: 'Shopping' });
  const badge = tab.locator('.mob-count');
  await expect(badge).toHaveText('12');
  await expect(badge).toHaveCSS('font-size', '10px');
  await expect(badge).toHaveCSS('line-height', '10px');

  const badgeBox = (await badge.boundingBox())!;
  const iconBox = (await tab.locator('svg').boundingBox())!;
  const labelBox = (await tab.locator('.mob-label').boundingBox())!;
  expect(badgeBox.y).toBeLessThan(iconBox.y);
  expect(badgeBox.x + badgeBox.width / 2).toBeGreaterThan(iconBox.x + iconBox.width / 2);
  expect(badgeBox.y + badgeBox.height).toBeLessThan(labelBox.y);
});

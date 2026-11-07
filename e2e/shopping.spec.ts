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

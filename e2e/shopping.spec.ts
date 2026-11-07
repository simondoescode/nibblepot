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

test('adds catalogue ingredients, larder picks and custom items from an empty list', async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('nibblepot-demo-v1')) {
      localStorage.setItem('nibblepot-demo-v1', JSON.stringify({ favorites: [], larder: ['rice'], shopping: [] }));
    }
  });
  await page.goto('/nibblepot/shopping/');
  const main = page.getByRole('main');
  const addItem = main.getByRole('button', { name: 'Add item', exact: true });
  const sheet = page.getByRole('dialog', { name: 'Add a shopping item' });
  const search = sheet.getByRole('searchbox');

  await addItem.click();
  await search.fill('pasta');
  await sheet.getByRole('button', { name: 'Add Pasta', exact: true }).click();
  await expect(main.getByRole('checkbox', { name: 'Mark Pasta as purchased' })).toBeVisible();

  await addItem.click();
  await sheet.getByRole('button', { name: 'My larder', exact: true }).click();
  await expect(sheet.getByRole('button', { name: 'Add Pasta', exact: true })).toHaveCount(0);
  await sheet.getByRole('button', { name: 'Add Rice', exact: true }).click();
  await expect(main.getByRole('checkbox', { name: 'Mark Rice as purchased' })).toBeVisible();

  await addItem.click();
  await search.fill('Washing up liquid');
  await sheet.getByRole('button', { name: 'Add “Washing up liquid” as a custom item', exact: true }).click();
  const custom = main.getByRole('region', { name: 'Other items shopping items' });
  const checkbox = custom.getByRole('checkbox', { name: 'Mark Washing up liquid as purchased' });
  await expect(custom.getByRole('link', { name: 'Find Washing up liquid at Tesco' }))
    .toHaveAttribute('href', /query=Washing%20up%20liquid$/);
  await checkbox.check();
  await page.reload();
  await expect(checkbox).toBeChecked();

  await addItem.click();
  await search.fill('washing up liquid');
  await search.press('Enter');
  await expect(checkbox).toHaveCount(1);
  await expect(checkbox).not.toBeChecked();
  await expect(main.getByRole('status')).toContainText('3 to buy');
  await custom.getByRole('button', { name: 'Remove Washing up liquid' }).click();
  await expect(custom).toHaveCount(0);
});

test('a partial search prioritises ingredients and Enter does not create a custom item', async ({ page }) => {
  await page.goto('/nibblepot/shopping/');
  const add = page.getByRole('button', { name: 'Add item', exact: true });
  const sheet = page.getByRole('dialog', { name: 'Add a shopping item' });
  const search = sheet.getByRole('searchbox');

  await add.click();
  await search.fill('pas');
  const ingredient = sheet.getByRole('button', { name: 'Add Pasta', exact: true });
  const custom = sheet.getByRole('button', { name: 'Add “pas” as a custom item' });
  expect((await ingredient.boundingBox())!.y).toBeLessThan((await custom.boundingBox())!.y);
  await search.press('Enter');
  await expect(sheet).toBeVisible();
  await sheet.getByRole('button', { name: 'My larder' }).click();
  await search.press('Enter');
  await expect(sheet).toBeVisible();
  await sheet.getByRole('button', { name: 'All ingredients' }).click();
  await ingredient.click();
  await expect(sheet).toHaveCount(0);
  await expect(add).toBeFocused();
  await expect(page.getByRole('checkbox', { name: 'Mark Pasta as purchased' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Mark pas as purchased', exact: true })).toHaveCount(0);
});

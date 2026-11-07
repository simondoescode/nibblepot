import { test, expect } from '@playwright/test';
test('tablet can drag a recipe onto a day and swap days',async({page})=>{
  await page.setViewportSize({width:1024,height:900});
  await page.goto('/nibblepot/planner/');
  await expect(page.locator('.planner-drag-tray')).toBeVisible();
  await page.locator('.planner-drag-recipe').first().dragTo(page.locator('.planner-day').first());
  const draggedTitle = await page.locator('.planner-drag-recipe').first().innerText();
  await expect(page.locator('.planner-day').first()).toContainText(draggedTitle);
  const before=await page.locator('.planner-day').nth(1).locator('.planner-picked strong').innerText();
  await page.locator('.planner-day').first().dragTo(page.locator('.planner-day').nth(1));
  await expect(page.locator('.planner-day').first().locator('.planner-picked strong')).toHaveText(before);
});
test('phone retains tap-to-choose planner',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/nibblepot/planner/');
  await expect(page.locator('.planner-drag-tray')).toBeHidden();
  await page.getByRole('button',{name:'Change Monday dinner'}).click();
  await expect(page.getByRole('dialog',{name:'Change Monday dinner'})).toBeVisible();
});

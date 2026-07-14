import { expect, test } from '@playwright/test';

test('demo mounts representative effects and keeps interactive children usable', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.getByLabel('Effect demonstrations').locator('.metal-fx-root')).toHaveCount(2);

  const upgrade = page.getByRole('button', { name: 'Upgrade to Pro' }).first();
  await upgrade.click();
  await expect(upgrade).toBeEnabled();
  await expect(page.getByLabel('Interactive playground').locator('.metal-fx-root')).toHaveCount(1);
  expect(errors).toEqual([]);
});

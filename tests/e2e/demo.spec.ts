import { expect, test } from '@playwright/test';

test('demo mounts representative effects and keeps interactive children usable', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('./');
  await expect(page).toHaveURL(/\/metal-fx\/$/);
  await expect(page.getByRole('main')).toBeVisible();
  await expect
    .poll(() =>
      page.locator('header img').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)
    )
    .toBe(true);

  const faviconUrl = await page.locator('link[rel="icon"]').evaluate((link: HTMLLinkElement) => link.href);
  expect(new URL(faviconUrl).pathname).toBe('/metal-fx/favicon.png');
  expect((await page.request.get(faviconUrl)).ok()).toBe(true);

  await expect(page.getByLabel('Effect demonstrations').locator('.metal-fx-root')).toHaveCount(2);

  const upgrade = page.getByRole('button', { name: 'Upgrade to Pro' }).first();
  await upgrade.click();
  await expect(upgrade).toBeEnabled();
  const playground = page.getByLabel('Interactive playground');
  const playgroundEffect = playground.locator('.metal-fx-root');
  await expect(playgroundEffect).toHaveCount(1);
  await expect(playgroundEffect.locator('.metal-fx-glow-svg')).toHaveCount(1);

  await playground.getByRole('button', { name: 'No Glow' }).click();
  await expect(playgroundEffect.locator('.metal-fx-glow-svg')).toHaveCount(0);

  await playground.getByRole('button', { name: 'No Glow' }).click();
  await expect(playgroundEffect.locator('.metal-fx-glow-svg')).toHaveCount(1);
  expect(errors).toEqual([]);
});

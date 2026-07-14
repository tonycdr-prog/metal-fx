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
  await page.getByRole('button', { name: 'Silver' }).click();

  const upgrade = page.getByRole('button', { name: 'Upgrade to Pro' }).first();
  await upgrade.click();
  await expect(upgrade).toBeEnabled();
  await expect(page.getByLabel('Interactive playground').locator('.metal-fx-root')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('falls back to visible interactive children when WebGL is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'OffscreenCanvas', { configurable: true, value: undefined });
    const nativeGetContext = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value(this: HTMLCanvasElement, contextId: string, ...args: unknown[]) {
        if (contextId === 'webgl' || contextId === 'experimental-webgl') return null;
        return Reflect.apply(nativeGetContext, this, [contextId, ...args]);
      }
    });
  });

  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('./');
  const effects = page.locator('.metal-fx-root');
  await expect.poll(() => effects.count()).toBeGreaterThan(0);
  await expect(effects.first()).toHaveAttribute('data-fallback', 'true');
  expect(
    await effects.evaluateAll((nodes) => nodes.every((node) => node.getAttribute('data-fallback') === 'true'))
  ).toBe(true);

  const upgrade = page.getByRole('button', { name: 'Upgrade to Pro' }).first();
  await expect(upgrade).toBeVisible();
  await upgrade.click();
  await expect(upgrade).toBeEnabled();
  await expect(effects.first().locator('.metal-fx-canvas')).toBeHidden();
  expect(errors).toEqual([]);
});

import { expect, test } from '@playwright/test';

test('demo mounts representative effects and keeps interactive children usable', async ({ browserName, page }) => {
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
  const playground = page.getByLabel('Interactive playground');
  const playgroundEffect = playground.locator('.metal-fx-root');
  await expect(playgroundEffect).toHaveCount(1);
  await expect(playgroundEffect.locator('.metal-fx-glow-svg')).toHaveCount(1);

  await playground.getByRole('button', { name: 'No Glow' }).click();
  await expect(playgroundEffect.locator('.metal-fx-glow-svg')).toHaveCount(0);

  await playground.getByRole('button', { name: 'No Glow' }).click();
  await expect(playgroundEffect.locator('.metal-fx-glow-svg')).toHaveCount(1);

  const states = page.getByLabel('Interaction States');
  const interactive = states.getByRole('button', { name: 'Hover, focus, press' });
  await interactive.hover();
  await expect(interactive).toHaveAttribute('data-hovered', 'true');

  await page.mouse.down();
  await expect(interactive).toHaveAttribute('data-pressed', 'true');
  await page.mouse.move(0, 0);
  await expect(interactive).not.toHaveAttribute('data-pressed', 'true');
  await page.mouse.up();

  const keyboardFocus = states.getByRole('button', { name: 'Keyboard focus' });
  await keyboardFocus.focus();
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Shift+Tab' : 'Shift+Tab');
  await expect(interactive).toBeFocused();
  await interactive.press('Space');
  await expect(states.getByTestId('activation-state')).toHaveText('Activated 1 time');
  await expect(states.getByRole('button', { name: 'Disabled' })).toBeDisabled();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(states.getByTestId('motion-state')).toHaveText('Reduced motion: on');
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

test('updates glow geometry in a live WebGL playground without remounting the effect', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('./');
  const playground = page.getByLabel('Interactive playground');
  const effect = playground.locator('.metal-fx-root');
  const glow = effect.locator('.metal-fx-glow-svg');
  const scale = playground.getByRole('slider', { name: 'Effect scale' });

  await expect(effect).toHaveCount(1);
  await expect(glow).toHaveCount(1);

  await scale.evaluate((input: HTMLInputElement) => {
    input.value = '2';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect.poll(() => glow.innerHTML()).toContain('stdDeviation="8.400"');
  await expect(effect).toHaveCount(1);

  await scale.evaluate((input: HTMLInputElement) => {
    input.value = '0.5';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect.poll(() => glow.innerHTML()).toContain('stdDeviation="2.100"');
  expect(errors).toEqual([]);
});

import { expect, type Page, test } from '@playwright/test';

declare global {
  interface Window {
    __metalFxTestCanvas: HTMLCanvasElement;
    __metalFxTestGl: WebGLRenderingContext;
    __metalFxLoseContext: WEBGL_lose_context;
    __metalFxCopyCount: number;
  }
}

async function exposeHtmlWebGlContext(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'OffscreenCanvas', { configurable: true, value: undefined });
    const nativeGetContext = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value(this: HTMLCanvasElement, contextId: string, ...args: unknown[]) {
        const context = Reflect.apply(nativeGetContext, this, [contextId, ...args]);
        if ((contextId === 'webgl' || contextId === 'experimental-webgl') && context) {
          window.__metalFxTestCanvas = this;
          (window as Window & { __metalFxTestGl?: WebGLRenderingContext }).__metalFxTestGl = context;
          const extension = (context as WebGLRenderingContext).getExtension('WEBGL_lose_context');
          if (extension) window.__metalFxLoseContext = extension;
        }
        return context;
      }
    });
  });
}

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
  await expect(page.getByLabel('Installation')).toContainText('npm install @tonycdr-prog/metal-fx');
  await expect(page.getByLabel('Usage')).toContainText("from '@tonycdr-prog/metal-fx'");
  await expect(page.getByRole('link', { name: 'GitHub repository' })).toHaveAttribute(
    'href',
    'https://github.com/tonycdr-prog/metal-fx'
  );

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
  await effect.evaluate((element) => element.setAttribute('data-test-scale-identity', 'stable'));

  await scale.fill('2');
  await expect(scale).toHaveValue('2');
  await expect.poll(() => glow.innerHTML()).toContain('stdDeviation="16.800"');
  await expect(effect).toHaveCount(1);
  await expect(effect).toHaveAttribute('data-test-scale-identity', 'stable');

  await scale.fill('0.5');
  await expect(scale).toHaveValue('0.5');
  await expect.poll(() => glow.innerHTML()).toContain('stdDeviation="1.050"');
  await expect(effect).toHaveAttribute('data-test-scale-identity', 'stable');
  expect(errors).toEqual([]);
});

test('restores a lost WebGL context and resumes painting without remounting', async ({ browserName, page }) => {
  test.skip(browserName !== 'chromium', 'Chromium provides deterministic WEBGL_lose_context restoration in CI.');
  await exposeHtmlWebGlContext(page);
  await page.goto('./');

  const effect = page.getByLabel('Interactive playground').locator('.metal-fx-root');
  const canvas = effect.locator('.metal-fx-canvas');
  await effect.scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Play shader animation' }).click();
  await expect(effect).not.toHaveAttribute('data-fallback', 'true');
  await effect.evaluate((element) => element.setAttribute('data-test-context-identity', 'stable'));
  await canvas.evaluate((element: HTMLCanvasElement) => {
    const context = element.getContext('2d');
    if (!context) return;
    const drawImage = context.drawImage;
    window.__metalFxCopyCount = 0;
    Object.defineProperty(context, 'drawImage', {
      configurable: true,
      value(this: CanvasRenderingContext2D, ...args: unknown[]) {
        window.__metalFxCopyCount++;
        return Reflect.apply(drawImage, this, args);
      }
    });
  });
  await expect.poll(() => page.evaluate(() => window.__metalFxCopyCount)).toBeGreaterThan(0);

  const controllable = await page.evaluate(() => {
    const gl = (window as Window & { __metalFxTestGl?: WebGLRenderingContext }).__metalFxTestGl;
    return Boolean(gl && window.__metalFxLoseContext);
  });
  test.skip(!controllable, 'WEBGL_lose_context is unavailable.');

  await page.evaluate(async () => {
    const lost = new Promise<void>((resolve) => {
      window.__metalFxTestCanvas.addEventListener('webglcontextlost', () => resolve(), { once: true });
    });
    window.__metalFxLoseContext.loseContext();
    await lost;
  });
  expect(await page.evaluate(() => window.__metalFxTestGl.isContextLost())).toBe(true);
  await page.evaluate(() => {
    window.__metalFxCopyCount = 0;
  });

  await page.evaluate(async () => {
    const restored = new Promise<void>((resolve) => {
      window.__metalFxTestCanvas.addEventListener('webglcontextrestored', () => resolve(), { once: true });
    });
    window.__metalFxLoseContext.restoreContext();
    await restored;
  });
  expect(await page.evaluate(() => window.__metalFxTestGl.isContextLost())).toBe(false);
  await expect.poll(() => page.evaluate(() => window.__metalFxCopyCount)).toBeGreaterThan(0);
  await expect(effect).toHaveAttribute('data-test-context-identity', 'stable');
  await expect(effect).not.toHaveAttribute('data-fallback', 'true');
});

test('falls back cleanly when the restored WebGL pipeline cannot rebuild', async ({ browserName, page }) => {
  test.skip(browserName !== 'chromium', 'Chromium provides deterministic WEBGL_lose_context restoration in CI.');
  await exposeHtmlWebGlContext(page);
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('./');

  const effects = page.locator('.metal-fx-root');
  await expect.poll(() => effects.count()).toBeGreaterThan(0);
  const controllable = await page.evaluate(() => {
    const gl = (window as Window & { __metalFxTestGl?: WebGLRenderingContext }).__metalFxTestGl;
    return Boolean(gl && window.__metalFxLoseContext);
  });
  test.skip(!controllable, 'WEBGL_lose_context is unavailable.');

  await page.evaluate(async () => {
    const lost = new Promise<void>((resolve) => {
      window.__metalFxTestCanvas.addEventListener('webglcontextlost', () => resolve(), { once: true });
    });
    window.__metalFxLoseContext.loseContext();
    await lost;
  });
  expect(await page.evaluate(() => window.__metalFxTestGl.isContextLost())).toBe(true);
  await page.evaluate(async () => {
    window.__metalFxTestGl.createBuffer = () => null;
    const restored = new Promise<void>((resolve) => {
      window.__metalFxTestCanvas.addEventListener('webglcontextrestored', () => resolve(), { once: true });
    });
    window.__metalFxLoseContext.restoreContext();
    await restored;
  });

  await expect(effects.first()).toHaveAttribute('data-fallback', 'true');
  expect(
    await effects.evaluateAll((nodes) => nodes.every((node) => node.getAttribute('data-fallback') === 'true'))
  ).toBe(true);
  const upgrade = page.getByRole('button', { name: 'Upgrade to Pro' }).first();
  await upgrade.click();
  await expect(upgrade).toBeEnabled();
  expect(errors).toEqual([]);
});

test('keyboard focus indication stays visible on wrapped children', async ({ browserName, page }) => {
  await page.goto('./');

  const interactive = page.getByLabel('Interaction States').getByRole('button', { name: 'Hover, focus, press' });
  await interactive.scrollIntoViewIfNeeded();
  // WebKit on macOS only reaches buttons with the Option modifier held.
  const tabKey = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
  for (let presses = 0; presses < 40; presses += 1) {
    await page.keyboard.press(tabKey);
    if (await interactive.evaluate((element) => element === document.activeElement)) break;
  }
  await expect(interactive).toBeFocused();

  const outline = await interactive.evaluate((element) => {
    const style = getComputedStyle(element);
    return { style: style.outlineStyle, width: style.outlineWidth };
  });
  expect(outline.style).not.toBe('none');
  expect(Number.parseFloat(outline.width)).toBeGreaterThan(0);
});

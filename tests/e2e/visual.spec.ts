import { expect, test } from '@playwright/test';

test('renders the fixed MetalFx visual test scene', async ({ page }) => {
  await page.addInitScript(() => {
    let nextFrame = 0;
    const callbacks = new Map<number, FrameRequestCallback>();
    window.requestAnimationFrame = (callback) => {
      const id = ++nextFrame;
      callbacks.set(id, callback);
      queueMicrotask(() => {
        const pending = callbacks.get(id);
        if (!pending) return;
        callbacks.delete(id);
        pending(1000);
      });
      return id;
    };
    window.cancelAnimationFrame = (id) => callbacks.delete(id);
    Object.defineProperty(performance, 'now', { configurable: true, value: () => 1000 });
  });

  await page.goto('./?visual-test=1');
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' });

  const scene = page.locator('[data-visual-test-scene]');
  await expect(scene).toBeVisible();
  await expect(scene.locator('.metal-fx-root')).toHaveCount(4);
  await expect
    .poll(() =>
      scene.locator('.metal-fx-root').evaluateAll((roots) =>
        roots.every((root) => {
          const canvas = root.querySelector('canvas');
          return getComputedStyle(root).opacity === '1' && canvas !== null && canvas.width > 0 && canvas.height > 0;
        })
      )
    )
    .toBe(true);

  await expect(scene).toHaveScreenshot('metal-fx-visual.png', { animations: 'disabled', maxDiffPixelRatio: 0.002 });
});

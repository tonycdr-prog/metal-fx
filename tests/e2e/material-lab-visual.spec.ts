import { expect, test } from '@playwright/test';

test('renders the deterministic Material Lab evidence fixture', async ({ page }) => {
  await page.addInitScript(() => {
    let nextFrame = 0;
    const callbacks = new Map<number, FrameRequestCallback>();
    window.requestAnimationFrame = (callback) => {
      const id = ++nextFrame;
      callbacks.set(id, callback);
      queueMicrotask(() => callbacks.get(id)?.(1000));
      return id;
    };
    window.cancelAnimationFrame = (id) => callbacks.delete(id);
    Object.defineProperty(performance, 'now', { configurable: true, value: () => 1000 });
  });

  await page.goto(
    './?material-lab=1&fixture=foundation&recipe=holographic&environment=spectral-wash&interaction=off&preview=pill&preset=chromatic&theme=dark&strength=92&paused=1'
  );
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({
    content:
      '*,*::before,*::after{animation:none!important;transition:none!important}.material-lab-reflection-target{visibility:hidden!important}.material-lab-pill{font-size:0!important}'
  });

  const stage = page.getByTestId('interaction-stage');
  await expect(stage).toBeVisible();
  await expect(stage.locator('.metal-fx-root')).toHaveCount(1);
  await expect
    .poll(() =>
      stage.locator('.metal-fx-root').evaluate((root) => {
        const canvas = root.querySelector('canvas');
        return getComputedStyle(root).opacity === '1' && canvas !== null && canvas.width > 0 && canvas.height > 0;
      })
    )
    .toBe(true);
  await expect(stage).toHaveScreenshot('material-lab-holographic.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.002
  });
});

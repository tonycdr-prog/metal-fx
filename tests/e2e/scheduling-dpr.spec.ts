import { expect, test } from '@playwright/test';

interface CanvasMeasurement {
  cssHeight: number;
  cssWidth: number;
  height: number;
  shape: string | null;
  width: number;
}

interface DprMeasurement {
  destination: CanvasMeasurement[];
  devicePixelRatio: number;
  reflection: CanvasMeasurement[];
  shared: { height: number; width: number }[];
}

test('characterizes shared and destination canvas DPR behavior in Chromium', async ({ browser, browserName }) => {
  test.skip(
    browserName !== 'chromium',
    'DPR instrumentation is Chromium-only; Firefox and WebKit retain semantic smoke coverage.'
  );

  async function capture(deviceScaleFactor: number): Promise<DprMeasurement> {
    const context = await browser.newContext({ deviceScaleFactor, viewport: { width: 1280, height: 720 } });
    try {
      await context.addInitScript(() => {
        const metrics: { shared: { height: number; width: number }[] } = { shared: [] };
        (window as Window & { __metalFxDprMetrics?: typeof metrics }).__metalFxDprMetrics = metrics;

        const record = (canvas: { height: number; width: number }) =>
          metrics.shared.push({ height: canvas.height, width: canvas.width });
        if (typeof OffscreenCanvas !== 'undefined') {
          const getContext = OffscreenCanvas.prototype.getContext;
          OffscreenCanvas.prototype.getContext = function (type, ...args) {
            if (type === 'webgl') record(this);
            return getContext.call(this, type, ...args);
          };
        }
        const getContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (type, ...args) {
          if (type === 'webgl' || type === 'experimental-webgl') record(this);
          return getContext.call(this, type, ...args);
        };
      });

      const page = await context.newPage();
      await page.goto('./');
      await page.evaluate(() => document.fonts.ready);
      const roots = page.locator('.metal-fx-root');
      await expect
        .poll(() =>
          roots.evaluateAll((elements) =>
            elements.every((root) => {
              const canvas = root.querySelector('canvas');
              return canvas !== null && canvas.width > 0 && canvas.height > 0 && getComputedStyle(root).opacity === '1';
            })
          )
        )
        .toBe(true);
      await expect(page.locator('.metal-fx-reflection-canvas').first()).toBeAttached();

      return await page.evaluate(() => {
        const metrics = (window as Window & { __metalFxDprMetrics: { shared: { height: number; width: number }[] } })
          .__metalFxDprMetrics;
        return {
          destination: [...document.querySelectorAll<HTMLElement>('.metal-fx-root')].map((root) => {
            const canvas = root.querySelector<HTMLCanvasElement>('canvas');
            const box = root.getBoundingClientRect();
            return {
              cssHeight: box.height,
              cssWidth: box.width,
              height: canvas?.height ?? 0,
              shape: root.dataset.variant ?? null,
              width: canvas?.width ?? 0
            };
          }),
          devicePixelRatio: window.devicePixelRatio,
          reflection: [...document.querySelectorAll<HTMLCanvasElement>('.metal-fx-reflection-canvas')].map((canvas) => {
            const box = canvas.getBoundingClientRect();
            return {
              cssHeight: box.height,
              cssWidth: box.width,
              height: canvas.height,
              shape: null,
              width: canvas.width
            };
          }),
          shared: metrics.shared
        };
      });
    } finally {
      await context.close();
    }
  }

  const one = await capture(1);
  const three = await capture(3);

  expect(one.devicePixelRatio).toBe(1);
  expect(three.devicePixelRatio).toBe(3);
  expect(one.shared[0]).toEqual({ height: 96, width: 96 });
  expect(three.shared[0]).toEqual({ height: 192, width: 192 });

  for (const measurement of [one, three]) {
    const backingDpr = Math.min(2, measurement.devicePixelRatio);
    for (const shape of ['button', 'circle']) {
      const canvas = measurement.destination.find((candidate) => candidate.shape === shape);
      expect(canvas, `expected a ${shape} destination canvas`).toBeDefined();
      expect(canvas?.width).toBe(Math.round((canvas?.cssWidth ?? 0) * backingDpr));
      expect(canvas?.height).toBe(Math.round((canvas?.cssHeight ?? 0) * backingDpr));
    }
  }

  const pillAtOne = one.destination.find((candidate) => candidate.shape === 'button');
  const pillAtThree = three.destination.find((candidate) => candidate.shape === 'button');
  expect(pillAtThree?.width).toBe((pillAtOne?.width ?? 0) * 2);
  const paintedAtOne = one.reflection.filter((canvas) => canvas.width > 1 && canvas.height > 1);
  const paintedAtThree = three.reflection.filter((canvas) => canvas.width > 1 && canvas.height > 1);
  expect(paintedAtThree.length).toBeGreaterThan(0);
  expect(paintedAtThree).toHaveLength(paintedAtOne.length);
  for (const [index, canvas] of paintedAtThree.entries()) {
    const atOne = paintedAtOne[index];
    expect(Math.abs(canvas.width - atOne.width * 2)).toBeLessThanOrEqual(1);
    expect(Math.abs(canvas.height - atOne.height * 2)).toBeLessThanOrEqual(1);
  }
});

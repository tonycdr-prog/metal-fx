import { expect, test } from '@playwright/test';

test('opens a deterministic Material Lab fixture and keeps one preview interactive', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto(
    './?material-lab=1&fixture=foundation&recipe=copper&interaction=press-hold&interactive=1&finish=brushed&preview=circle&preset=gold&theme=light&strength=62&paused=1'
  );
  await expect(page.getByRole('heading', { name: 'Explore the finish.' })).toBeVisible();
  const lab = page.getByRole('main');
  await expect(lab.getByLabel('Live Material Lab preview').locator('.metal-fx-root')).toHaveCount(1);
  await expect(lab.getByRole('button', { name: 'Circle', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(lab.getByLabel('Preset')).toHaveValue('gold');
  await expect(lab.getByLabel('Finish')).toHaveValue('brushed');
  await expect(lab.getByLabel('Theme')).toHaveValue('light');
  await expect(lab.getByLabel('Strength')).toHaveValue('62');
  await expect(lab.getByLabel('Interaction')).toHaveCount(0);
  await expect(lab.getByRole('button', { name: 'Disable responsive lighting' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await expect(lab.locator('.metal-fx-root')).toHaveAttribute('data-interactive', 'true');
  await expect(lab.getByRole('button', { name: 'Resume preview motion' })).toHaveAttribute('aria-pressed', 'true');

  await lab.getByLabel('Preset').selectOption('silver');
  await expect(page).toHaveURL(/preset=silver/);
  await lab.getByLabel('Finish').selectOption('holographic');
  await expect(page).toHaveURL(/finish=holographic/);
  await expect(lab.locator('.metal-fx-root')).toHaveAttribute('data-finish', 'holographic');
  await lab.getByRole('button', { name: 'Content' }).press('Enter');
  await expect(page).toHaveURL(/preview=content/);
  await lab.getByRole('button', { name: 'Resume preview motion' }).click();
  await expect(lab.getByRole('button', { name: 'Pause preview motion' })).toHaveAttribute('aria-pressed', 'false');
  const environment = lab.getByLabel('Backdrop');
  const stage = lab.getByTestId('material-lab-stage');
  await expect(stage).toHaveCSS('transform', 'none');
  await expect(page).not.toHaveURL(/[?&]interaction=/);
  await environment.selectOption('moving-softbox');
  await expect(stage).toHaveClass(/material-lab-environment-moving/);
  await lab.getByRole('button', { name: 'Pause preview motion' }).click();
  await expect(stage).not.toHaveClass(/material-lab-environment-moving/);
  await lab.getByRole('button', { name: '2×' }).click();
  await expect(page).toHaveURL(/zoom=2/);
  await expect(lab.getByRole('button', { name: '2×' })).toHaveAttribute('aria-pressed', 'true');
  await expect(lab.getByRole('button', { name: '1×', exact: true })).toHaveAttribute('aria-pressed', 'false');
  expect(errors).toEqual([]);
});

test('responsive lighting repaints a paused material without moving its control', async ({ page }) => {
  await page.goto(
    './?material-lab=1&fixture=foundation&recipe=molten-chrome&finish=molten&interactive=1&preview=pill&preset=chromatic&theme=dark&strength=100&paused=1'
  );
  const lab = page.getByRole('main');
  const root = lab.locator('.metal-fx-root');
  const canvas = root.locator('canvas');
  const button = lab.getByRole('button', { name: 'Upgrade to Pro' });
  await expect(canvas).toBeVisible();
  await expect(root).toHaveAttribute('data-interactive', 'true');
  await expect(button).toHaveCSS('transform', 'none');

  const readCanvas = () => canvas.evaluate((element) => (element as HTMLCanvasElement).toDataURL());
  const idleFrame = await readCanvas();
  const bounds = await root.boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.move((bounds?.x ?? 0) + (bounds?.width ?? 0) * 0.8, (bounds?.y ?? 0) + (bounds?.height ?? 0) * 0.25);
  await expect.poll(readCanvas).not.toBe(idleFrame);
  const litFrame = await readCanvas();

  await page.mouse.down();
  await expect.poll(readCanvas).not.toBe(litFrame);
  const pressedFrame = await readCanvas();
  await page.mouse.up();
  await expect.poll(readCanvas).not.toBe(pressedFrame);
  await expect(button).toHaveCSS('transform', 'none');

  await button.focus();
  await expect(button).toBeFocused();
  await page.waitForTimeout(100);
  const focusedFrame = await readCanvas();
  await page.keyboard.down('Enter');
  await expect.poll(readCanvas).not.toBe(focusedFrame);
  const keyboardPressedFrame = await readCanvas();
  await page.keyboard.up('Enter');
  await expect.poll(readCanvas).not.toBe(keyboardPressedFrame);
  await expect(button).toBeFocused();
});

test('selects every experimental treatment through stable query state', async ({ page }) => {
  await page.goto('./?material-lab=1');
  const treatments = page.getByLabel('Experimental material treatments').getByRole('button');
  await expect(treatments).toHaveCount(7);
  for (const treatment of await treatments.all()) {
    const label = await treatment.textContent();
    await treatment.click();
    await expect(treatment).toHaveAttribute('aria-current', 'true');
    await expect(page).toHaveURL(/recipe=/);
    await expect(page.getByLabel('Live Material Lab preview').locator('.metal-fx-root')).toHaveCount(1);
    expect(label).toBeTruthy();
  }
});

test('uses the showcase typography and keeps the mobile interface readable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./?material-lab=1');

  const lab = page.getByRole('main');
  await expect(lab).toHaveCSS('font-family', /Inter/);
  await expect(lab.getByRole('heading', { name: 'Explore the finish.' })).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(lab.getByLabel('Material Lab controls')).toHaveCSS('color', 'rgb(251, 251, 251)');
  await expect(lab.getByLabel('Preset')).toHaveCSS('color-scheme', 'dark');
  await expect(lab.getByRole('option', { name: 'Silver' })).toHaveCSS('color', 'rgb(251, 251, 251)');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

  await lab.getByRole('button', { name: 'Brushed metal' }).click();
  const lightPreviewButton = lab.getByRole('button', { name: 'Upgrade to Pro' });
  await expect(lightPreviewButton).toHaveCSS('color', 'rgb(23, 23, 25)');
  await lightPreviewButton.focus();
  await expect(lightPreviewButton).toHaveCSS('outline-color', 'rgb(23, 23, 25)');
  await expect(lab.getByRole('link', { name: 'Metal FX' })).toHaveAttribute('href', './');
});

test('leaves the standard demo and visual fixture routes intact', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByLabel('Interactive playground')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Explore the finish.' })).toHaveCount(0);

  await page.goto('./?visual-test=1');
  await expect(page.locator('[data-visual-test-scene]')).toBeVisible();
});

test('responsive lighting visibly follows the pointer across the material', async ({ browserName, page }) => {
  test.skip(browserName !== 'chromium', 'Pixel readback timing is only deterministic enough in Chromium.');
  await page.goto('./?material-lab=1&recipe=mercury&preview=pill&interactive=1&paused=0&strength=100');
  const frame = page.locator('.material-lab-stage .metal-fx-root').first();
  await expect(frame).toBeVisible();
  await expect(frame).not.toHaveAttribute('data-fallback', 'true');

  // Average ring luminance per half over several frames so the ambient
  // animation cancels out and only the pointer-following term remains.
  const sideBias = async () => {
    let bias = 0;
    for (let sample = 0; sample < 8; sample += 1) {
      bias += await frame.evaluate((root) => {
        const canvas = root.querySelector('canvas') as HTMLCanvasElement;
        const context = canvas.getContext('2d') as CanvasRenderingContext2D;
        const { width, height } = canvas;
        const pixels = context.getImageData(0, 0, width, height).data;
        let left = 0;
        let right = 0;
        let leftCount = 0;
        let rightCount = 0;
        for (let y = 0; y < height; y += 1) {
          for (let x = 0; x < width; x += 1) {
            const index = (y * width + x) * 4;
            const alpha = pixels[index + 3];
            if (alpha < 10) continue;
            const luminance = ((pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3) * (alpha / 255);
            if (x < width / 2) {
              left += luminance;
              leftCount += 1;
            } else {
              right += luminance;
              rightCount += 1;
            }
          }
        }
        return left / Math.max(1, leftCount) - right / Math.max(1, rightCount);
      });
      await page.waitForTimeout(180);
    }
    return bias / 8;
  };

  const box = (await frame.boundingBox()) as { x: number; y: number; width: number; height: number };
  await page.mouse.move(box.x + box.width * 0.08, box.y + box.height / 2, { steps: 4 });
  const biasWithPointerLeft = await sideBias();
  await page.mouse.move(box.x + box.width * 0.92, box.y + box.height / 2, { steps: 4 });
  const biasWithPointerRight = await sideBias();

  // The lit side must follow the pointer: left-bias when the pointer is on
  // the left must exceed left-bias when it is on the right by a clear margin.
  expect(biasWithPointerLeft).toBeGreaterThan(biasWithPointerRight + 4);
});

test('reports the static fallback and disables shader-only controls when WebGL is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    const block = (prototype: { getContext: (...args: unknown[]) => unknown }) => {
      const original = prototype.getContext;
      prototype.getContext = function blockedGetContext(type: string, ...args: unknown[]) {
        if (String(type).includes('webgl')) return null;
        return Reflect.apply(original, this, [type, ...args]);
      };
    };
    block(HTMLCanvasElement.prototype);
    if (typeof OffscreenCanvas !== 'undefined') block(OffscreenCanvas.prototype);
  });
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('./?material-lab=1');
  const lab = page.getByLabel('Live Material Lab preview');
  await expect(lab.locator('.metal-fx-root')).toHaveAttribute('data-fallback', 'true');
  await expect(lab.getByText('Static fallback — WebGL unavailable')).toBeVisible();

  const main = page.getByRole('main');
  await expect(main.getByLabel('Finish')).toBeDisabled();
  await expect(main.getByLabel('Preset')).toBeDisabled();
  await expect(main.getByLabel('Strength')).toBeDisabled();
  await expect(main.getByRole('button', { name: 'Enable responsive lighting' })).toBeDisabled();
  await expect(main.getByRole('button', { name: 'Pause preview motion' })).toBeDisabled();
  // Presentation controls still work: the static child and backdrop are real.
  await expect(main.getByLabel('Backdrop')).toBeEnabled();
  await expect(main.getByRole('button', { name: 'Circle' })).toBeEnabled();
  await main.getByRole('button', { name: 'Circle' }).click();
  await expect(page).toHaveURL(/preview=circle/);
  expect(errors).toEqual([]);
});

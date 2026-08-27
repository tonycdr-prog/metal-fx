import { expect, test } from '@playwright/test';

test('metal-kit prototype renders live components with working activation and visible focus', async ({
  browserName,
  page
}) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('./?metal-kit=1');
  await expect(page.getByRole('heading', { name: 'Hero components.' })).toBeVisible();

  // All three component families mount with real metal frames (no fallback).
  const frames = page.locator('.metal-fx-root');
  await expect.poll(() => frames.count()).toBeGreaterThanOrEqual(10);
  expect(await frames.evaluateAll((nodes) => nodes.some((node) => node.getAttribute('data-fallback') === 'true'))).toBe(
    false
  );

  // Native activation still works through the wrapper.
  await page.getByRole('button', { name: 'mercury' }).click();
  await expect(page.getByTestId('kit-activations')).toHaveText('Activated 1 time');

  // Disabled stays inert.
  await page.getByRole('button', { name: 'Disabled' }).click({ force: true });
  await expect(page.getByTestId('kit-activations')).toHaveText('Activated 1 time');

  // Keyboard: focus is visible and Enter activates.
  const target = page.getByRole('button', { name: 'mercury' });
  const forwardTab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
  const reverseTab = browserName === 'webkit' ? 'Alt+Shift+Tab' : 'Shift+Tab';
  await target.focus();
  await page.keyboard.press(forwardTab);
  await page.keyboard.press(reverseTab);
  await expect(target).toBeFocused();
  const outline = await target.evaluate((element) => {
    const style = getComputedStyle(element);
    return { style: style.outlineStyle, width: Number.parseFloat(style.outlineWidth) };
  });
  expect(outline.style).not.toBe('none');
  expect(outline.width).toBeGreaterThan(0);
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('kit-activations')).toHaveText('Activated 2 times');

  expect(errors).toEqual([]);
});

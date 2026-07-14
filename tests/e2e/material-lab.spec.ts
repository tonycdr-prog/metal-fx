import { expect, test } from '@playwright/test';

test('opens a deterministic Material Lab fixture and keeps one preview interactive', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('./?material-lab=1&fixture=foundation&preview=circle&preset=gold&theme=light&strength=62&paused=1');
  await expect(page.getByRole('heading', { name: 'A single surface for honest treatment studies.' })).toBeVisible();
  const lab = page.getByRole('main');
  await expect(lab.getByLabel('Live Material Lab preview').locator('.metal-fx-root')).toHaveCount(1);
  await expect(lab.getByRole('button', { name: 'Circle', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(lab.getByLabel('Native preset')).toHaveValue('gold');
  await expect(lab.getByLabel('Viewing context')).toHaveValue('light');
  await expect(lab.getByLabel(/Effect strength/)).toHaveValue('62');
  await expect(lab.getByRole('button', { name: 'Resume preview motion' })).toHaveAttribute('aria-pressed', 'true');

  await lab.getByLabel('Native preset').selectOption('silver');
  await expect(page).toHaveURL(/preset=silver/);
  await lab.getByRole('button', { name: 'Content' }).press('Enter');
  await expect(page).toHaveURL(/preview=content/);
  await lab.getByRole('button', { name: 'Resume preview motion' }).click();
  await expect(lab.getByRole('button', { name: 'Pause preview motion' })).toHaveAttribute('aria-pressed', 'false');
  expect(errors).toEqual([]);
});

test('leaves the standard demo and visual fixture routes intact', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByLabel('Interactive playground')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'A single surface for honest treatment studies.' })).toHaveCount(0);

  await page.goto('./?visual-test=1');
  await expect(page.locator('[data-visual-test-scene]')).toBeVisible();
});

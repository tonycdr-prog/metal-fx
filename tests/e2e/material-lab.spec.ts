import { expect, test } from '@playwright/test';

test('opens a deterministic Material Lab fixture and keeps one preview interactive', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto(
    './?material-lab=1&fixture=foundation&recipe=copper&interaction=press-hold&preview=circle&preset=gold&theme=light&strength=62&paused=1'
  );
  await expect(page.getByRole('heading', { name: 'Explore the finish.' })).toBeVisible();
  const lab = page.getByRole('main');
  await expect(lab.getByLabel('Live Material Lab preview').locator('.metal-fx-root')).toHaveCount(1);
  await expect(lab.getByRole('button', { name: 'Circle', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(lab.getByLabel('Preset')).toHaveValue('gold');
  await expect(lab.getByLabel('Theme')).toHaveValue('light');
  await expect(lab.getByLabel('Strength')).toHaveValue('62');
  await expect(lab.getByLabel('Interaction')).toHaveCount(0);
  await expect(lab.getByRole('button', { name: 'Resume preview motion' })).toHaveAttribute('aria-pressed', 'true');

  await lab.getByLabel('Preset').selectOption('silver');
  await expect(page).toHaveURL(/preset=silver/);
  await lab.getByRole('button', { name: 'Content' }).press('Enter');
  await expect(page).toHaveURL(/preview=content/);
  await lab.getByRole('button', { name: 'Resume preview motion' }).click();
  await expect(lab.getByRole('button', { name: 'Pause preview motion' })).toHaveAttribute('aria-pressed', 'false');
  const environment = lab.getByLabel('Environment');
  const stage = lab.getByTestId('material-lab-stage');
  await expect(stage).toHaveCSS('transform', 'none');
  await expect(page).not.toHaveURL(/interaction=/);
  await environment.selectOption('moving-softbox');
  await expect(stage).toHaveClass(/material-lab-environment-moving/);
  await lab.getByRole('button', { name: 'Pause preview motion' }).click();
  await expect(stage).not.toHaveClass(/material-lab-environment-moving/);
  expect(errors).toEqual([]);
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

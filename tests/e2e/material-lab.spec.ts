import { expect, test } from '@playwright/test';

test('opens a deterministic Material Lab fixture and keeps one preview interactive', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto(
    './?material-lab=1&fixture=foundation&recipe=copper&preview=circle&preset=gold&theme=light&strength=62&paused=1'
  );
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
  const environment = lab.getByLabel('Lighting environment');
  const interaction = lab.getByLabel('Demo interaction');
  const stage = lab.getByTestId('interaction-stage');
  await environment.selectOption('moving-softbox');
  await expect(stage).toHaveClass(/material-lab-environment-moving/);
  await interaction.selectOption('pointer-position');
  await stage.hover({ position: { x: 4, y: 10 } });
  await expect(stage).toHaveAttribute('data-interaction-mode', 'pointer-position');
  await expect(stage).not.toHaveAttribute('data-interaction-signal', '0.00');
  await interaction.selectOption('press-hold');
  await stage.getByRole('button').focus();
  await page.keyboard.down(' ');
  await expect(stage).toHaveAttribute('data-interaction-signal', '1.00');
  await page.keyboard.up(' ');
  await expect(stage).toHaveAttribute('data-interaction-signal', '0.00');
  await interaction.selectOption('idle-breathing');
  await expect(stage).toHaveClass(/material-lab-stage-breathing/);
  await lab.getByRole('button', { name: 'Pause preview motion' }).click();
  await expect(stage).not.toHaveClass(/material-lab-stage-breathing/);
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

test('leaves the standard demo and visual fixture routes intact', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByLabel('Interactive playground')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'A single surface for honest treatment studies.' })).toHaveCount(0);

  await page.goto('./?visual-test=1');
  await expect(page.locator('[data-visual-test-scene]')).toBeVisible();
});

import { test, expect } from '@playwright/test';

test.describe('Races', () => {
  test('lists seeded races', async ({ page }) => {
    await page.goto('/races');
    await expect(page.getByText(/E2E Race/)).toBeVisible({ timeout: 10000 });
  });

  test('views race detail with location pool', async ({ page }) => {
    await test.step('navigate to race', async () => {
      await page.goto('/races');
      await page.getByRole('link', { name: 'View' }).first().click();
    });

    await test.step('verify race details visible', async () => {
      await expect(page.getByText(/5/)).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(/E2E Cobra/)).toBeVisible();
    });
  });

  test('creates a new race', async ({ page }) => {
    await test.step('navigate to new race form', async () => {
      await page.goto('/races');
      await page.getByRole('link', { name: /new race/i }).click();
      await expect(page).toHaveURL('/races/new');
    });

    await test.step('fill in race details', async () => {
      await page.getByLabel('Name').fill('PW Test Race');
      await page.getByLabel('Num Stops').fill('3');
      await page.getByLabel('Max Teams').fill('50');
      await page.getByLabel('People Per Team').fill('5');
      await page.getByLabel('Min Total Distance').fill('3.0');
      await page.getByLabel('Max Total Distance').fill('5.0');
      await page.getByLabel('Min Leg Distance').fill('0.5');
      await page.getByLabel('Max Leg Distance').fill('2.0');
    });

    await test.step('select start and finish locations', async () => {
      // Select from the Start and Finish dropdowns
      const startSelect = page.getByLabel('Start Location');
      await startSelect.selectOption({ index: 1 });
      const finishSelect = page.getByLabel('Finish Location');
      await finishSelect.selectOption({ index: 1 });
    });

    await test.step('submit', async () => {
      await page.getByRole('button', { name: /create/i }).click();
      await expect(page.getByText('PW Test Race')).toBeVisible({ timeout: 10000 });
    });
  });
});

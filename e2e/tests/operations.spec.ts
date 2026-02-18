import { test, expect } from '@playwright/test';

test.describe('Operations', () => {
  test('generates legs for a race (mock mode)', async ({ page }) => {
    await test.step('navigate to race detail', async () => {
      await page.goto('/races');
      await page.getByRole('link', { name: 'View' }).first().click();
      await expect(page.getByText(/E2E Race/)).toBeVisible({ timeout: 10000 });
    });

    await test.step('ensure mock mode is on', async () => {
      const mockCheckbox = page.getByLabel(/mock mode/i);
      if (!(await mockCheckbox.isChecked())) {
        await mockCheckbox.check();
      }
    });

    await test.step('trigger leg generation', async () => {
      await page.getByRole('button', { name: /generate legs/i }).click();
    });

    await test.step('wait for progress and completion', async () => {
      await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(/completed/i)).toBeVisible({ timeout: 15000 });
    });
  });

  test('generates routes for a race', async ({ page }) => {
    await test.step('navigate to race detail', async () => {
      await page.goto('/races');
      await page.getByRole('link', { name: 'View' }).first().click();
      await expect(page.getByText(/E2E Race/)).toBeVisible({ timeout: 10000 });
    });

    await test.step('trigger route generation', async () => {
      await page.getByRole('button', { name: /generate routes/i }).click();
    });

    await test.step('wait for completion', async () => {
      await expect(page.getByText(/completed/i)).toBeVisible({ timeout: 15000 });
    });
  });
});

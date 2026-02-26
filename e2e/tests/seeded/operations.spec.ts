import { seededTest as test, expect } from '../../fixtures';

test.describe('Operations', () => {
  test('generates legs for a race (mock mode)', async ({ page }) => {
    await test.step('navigate to race detail', async () => {
      await page.goto('/races');
      await page.locator('[id^="view-race-"]').first().click();
      await expect(page.locator('#race-page-title')).toContainText(/E2E Race/, { timeout: 10000 });
    });

    await test.step('ensure mock mode is on', async () => {
      const mockCheckbox = page.locator('#mock-mode-checkbox');
      if (!(await mockCheckbox.isChecked())) {
        await mockCheckbox.check();
      }
    });

    await test.step('trigger leg generation', async () => {
      await page.locator('#btn-generate-legs').click();
    });

    await test.step('wait for progress and completion', async () => {
      await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('[data-testid="progress-status"][data-status="completed"]')).toBeVisible({ timeout: 30000 });
    });
  });

  test('generates routes for a race', async ({ page }) => {
    await test.step('navigate to race detail', async () => {
      await page.goto('/races');
      await page.locator('[id^="view-race-"]').first().click();
      await expect(page.locator('#race-page-title')).toContainText(/E2E Race/, { timeout: 10000 });
    });

    await test.step('trigger route generation', async () => {
      await page.locator('#btn-generate-routes').click();
    });

    await test.step('wait for completion', async () => {
      await expect(page.locator('[data-testid="progress-status"][data-status="completed"]')).toBeVisible({ timeout: 30000 });
    });
  });

  test('ranks routes for a race', async ({ page }) => {
    await test.step('navigate to race detail', async () => {
      await page.goto('/races');
      await page.locator('[id^="view-race-"]').first().click();
      await expect(page.locator('#race-page-title')).toContainText(/E2E Race/, { timeout: 10000 });
    });

    await test.step('verify button order', async () => {
      await expect(page.locator('#btn-generate-legs')).toBeVisible();
      await expect(page.locator('#btn-generate-routes')).toBeVisible();
      await expect(page.locator('#btn-rank-routes')).toBeVisible();
    });

    await test.step('trigger rank routes', async () => {
      await page.locator('#btn-rank-routes').click();
    });

    await test.step('wait for completion', async () => {
      await expect(page.locator('[data-testid="progress-status"][data-status="completed"]')).toBeVisible({ timeout: 30000 });
    });
  });
});

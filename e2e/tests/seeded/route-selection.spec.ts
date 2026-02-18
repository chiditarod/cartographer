import { seededTest as test, expect } from '../../fixtures';

test.describe('Route Selection', () => {
  test('selects routes with checkboxes and updates button labels', async ({ page }) => {
    await test.step('navigate to race detail', async () => {
      await page.goto('/races');
      await page.getByRole('link', { name: 'View' }).first().click();
      await expect(page.locator('#race-page-title')).toContainText(/E2E Race/, { timeout: 10000 });
    });

    await test.step('verify checkboxes are visible and buttons start without counts', async () => {
      await expect(page.locator('[data-testid="select-all-routes"]')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('#export-csv-btn')).toHaveText('Export CSV');
      await expect(page.locator('#delete-selected-routes-btn')).toBeDisabled();
      await expect(page.locator('#delete-selected-routes-btn')).toHaveText('Delete');
    });

    await test.step('select first route checkbox', async () => {
      const firstCheckbox = page.locator('input[type="checkbox"][data-testid^="select-route-"]').first();
      await firstCheckbox.check();
      await expect(page.locator('#export-csv-btn')).toHaveText('Export CSV (1)');
      await expect(page.locator('#delete-selected-routes-btn')).toBeEnabled();
      await expect(page.locator('#delete-selected-routes-btn')).toHaveText('Delete (1)');
    });

    await test.step('select all routes via header checkbox', async () => {
      await page.locator('[data-testid="select-all-routes"]').check();
      await expect(page.locator('#export-csv-btn')).toHaveText('Export CSV (2)');
      await expect(page.locator('#delete-selected-routes-btn')).toHaveText('Delete (2)');
    });

    await test.step('deselect all routes via header checkbox', async () => {
      await page.locator('[data-testid="select-all-routes"]').uncheck();
      await expect(page.locator('#export-csv-btn')).toHaveText('Export CSV');
      await expect(page.locator('#delete-selected-routes-btn')).toBeDisabled();
    });
  });

  test('deletes selected routes', async ({ page }) => {
    await test.step('navigate to race detail', async () => {
      await page.goto('/races');
      await page.getByRole('link', { name: 'View' }).first().click();
      await expect(page.locator('#race-page-title')).toContainText(/E2E Race/, { timeout: 10000 });
    });

    await test.step('select first route and delete it', async () => {
      const firstCheckbox = page.locator('input[type="checkbox"][data-testid^="select-route-"]').first();
      await expect(firstCheckbox).toBeVisible({ timeout: 10000 });
      await firstCheckbox.check();
      await page.locator('#delete-selected-routes-btn').click();
    });

    await test.step('confirm deletion in modal', async () => {
      await expect(page.getByText('This cannot be undone')).toBeVisible();
      await page.locator('#confirm-delete-selected-routes-btn').click();
    });

    await test.step('verify one route remains', async () => {
      await expect(page.getByText(/Deleted 1 route\b/)).toBeVisible({ timeout: 10000 });
      // After deleting 1 of 2 routes, there should be 1 route row remaining
      const routeCheckboxes = page.locator('input[type="checkbox"][data-testid^="select-route-"]');
      await expect(routeCheckboxes).toHaveCount(1, { timeout: 10000 });
    });
  });
});

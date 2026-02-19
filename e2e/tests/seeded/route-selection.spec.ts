import { seededTest as test, expect } from '../../fixtures';

test.describe('Route Selection', () => {
  test('selects routes with checkboxes and updates button labels', async ({ page }) => {
    await test.step('navigate to race detail', async () => {
      await page.goto('/races');
      await page.locator('[id^="view-race-"]').first().click();
      await expect(page.locator('#race-page-title')).toContainText(/E2E Race/, { timeout: 10000 });
    });

    await test.step('verify checkboxes are visible and buttons start without counts', async () => {
      await expect(page.locator('[data-testid="select-all-routes"]')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('#export-csv-btn')).toHaveText('Export CSV');
      await expect(page.locator('#download-pdf-btn')).toBeDisabled();
      await expect(page.locator('#download-pdf-btn')).toHaveText('Download PDF');
      await expect(page.locator('#delete-selected-routes-btn')).toBeDisabled();
      await expect(page.locator('#delete-selected-routes-btn')).toHaveText('Delete');
    });

    await test.step('select first route checkbox', async () => {
      const firstCheckbox = page.locator('input[type="checkbox"][data-testid^="select-route-"]').first();
      await firstCheckbox.check();
      await expect(page.locator('#export-csv-btn')).toHaveText('Export CSV (1)');
      await expect(page.locator('#download-pdf-btn')).toBeEnabled();
      await expect(page.locator('#download-pdf-btn')).toHaveText('Download PDF (1)');
      await expect(page.locator('#delete-selected-routes-btn')).toBeEnabled();
      await expect(page.locator('#delete-selected-routes-btn')).toHaveText('Delete (1)');
    });

    await test.step('select all routes via header checkbox', async () => {
      await page.locator('[data-testid="select-all-routes"]').check();
      await expect(page.locator('#export-csv-btn')).toHaveText('Export CSV (2)');
      await expect(page.locator('#download-pdf-btn')).toHaveText('Download PDF (2)');
      await expect(page.locator('#delete-selected-routes-btn')).toHaveText('Delete (2)');
    });

    await test.step('deselect all routes via header checkbox', async () => {
      await page.locator('[data-testid="select-all-routes"]').uncheck();
      await expect(page.locator('#export-csv-btn')).toHaveText('Export CSV');
      await expect(page.locator('#delete-selected-routes-btn')).toBeDisabled();
      await expect(page.locator('#download-pdf-btn')).toBeDisabled();
    });
  });

  test('downloads batch PDF for selected routes', async ({ page }) => {
    await test.step('navigate to race detail', async () => {
      await page.goto('/races');
      await page.locator('[id^="view-race-"]').first().click();
      await expect(page.locator('#race-page-title')).toContainText(/E2E Race/, { timeout: 10000 });
    });

    await test.step('verify Download PDF button disabled initially', async () => {
      await expect(page.locator('#download-pdf-btn')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('#download-pdf-btn')).toBeDisabled();
      await expect(page.locator('#download-pdf-btn')).toHaveText('Download PDF');
    });

    await test.step('select routes and verify button updates', async () => {
      const firstCheckbox = page.locator('input[type="checkbox"][data-testid^="select-route-"]').first();
      await firstCheckbox.check();
      await expect(page.locator('#download-pdf-btn')).toBeEnabled();
      await expect(page.locator('#download-pdf-btn')).toHaveText('Download PDF (1)');
    });

    await test.step('click Download PDF triggers file download', async () => {
      const downloadPromise = page.waitForEvent('download');
      await page.locator('#download-pdf-btn').click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    });
  });

  test('deletes selected routes', async ({ page }) => {
    await test.step('navigate to race detail', async () => {
      await page.goto('/races');
      await page.locator('[id^="view-race-"]').first().click();
      await expect(page.locator('#race-page-title')).toContainText(/E2E Race/, { timeout: 10000 });
    });

    await test.step('select first route and delete it', async () => {
      const firstCheckbox = page.locator('input[type="checkbox"][data-testid^="select-route-"]').first();
      await expect(firstCheckbox).toBeVisible({ timeout: 10000 });
      await firstCheckbox.check();
      await page.locator('#delete-selected-routes-btn').click();
    });

    await test.step('confirm deletion in modal', async () => {
      await expect(page.locator('#delete-selected-modal-body')).toBeVisible();
      await page.locator('#confirm-delete-selected-routes-btn').click();
    });

    await test.step('verify one route remains', async () => {
      await expect(page.locator('[data-testid="notification"]')).toBeVisible({ timeout: 10000 });
      // After deleting 1 of 2 routes, there should be 1 route row remaining
      const routeCheckboxes = page.locator('input[type="checkbox"][data-testid^="select-route-"]');
      await expect(routeCheckboxes).toHaveCount(1, { timeout: 10000 });
    });
  });
});

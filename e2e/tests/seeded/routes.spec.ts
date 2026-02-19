import { seededTest as test, expect } from '../../fixtures';

test.describe('Routes', () => {
  test('views routes list on race detail', async ({ page }) => {
    await test.step('navigate to race', async () => {
      await page.goto('/races');
      await page.locator('[id^="view-race-"]').first().click();
      await expect(page.locator('#race-page-title')).toContainText(/E2E Race/, { timeout: 10000 });
    });

    await test.step('verify routes are visible', async () => {
      await expect(page.locator('[id^="view-route-"]').first()).toBeVisible({ timeout: 10000 });
    });
  });

  test('views route detail', async ({ page }) => {
    await test.step('navigate to race', async () => {
      await page.goto('/races');
      await page.locator('[id^="view-race-"]').first().click();
      await expect(page.locator('#race-page-title')).toContainText(/E2E Race/, { timeout: 10000 });
    });

    await test.step('click first route', async () => {
      const viewLinks = page.locator('[id^="view-route-"]');
      if ((await viewLinks.count()) > 0) {
        await viewLinks.first().click();
        await expect(page.locator('#route-name')).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test('renames a route', async ({ page }) => {
    await test.step('navigate to a route', async () => {
      await page.goto('/races');
      await page.locator('[id^="view-race-"]').first().click();
      await expect(page.locator('#race-page-title')).toContainText(/E2E Race/, { timeout: 10000 });
    });

    await test.step('rename the route', async () => {
      const viewLinks = page.locator('[id^="view-route-"]');
      if ((await viewLinks.count()) > 0) {
        await viewLinks.first().click();

        const nameInput = page.locator('#route-name-input');
        await expect(nameInput).toBeVisible({ timeout: 10000 });
        await nameInput.fill('Alpha Route');
        await page.locator('#route-save-btn').click();
        await expect(page.locator('#route-name')).toHaveText('Alpha Route', { timeout: 10000 });
      }
    });
  });

  test('downloads route PDF', async ({ page }) => {
    await test.step('navigate to route detail', async () => {
      await page.goto('/races');
      await page.locator('[id^="view-race-"]').first().click();
      await expect(page.locator('#race-page-title')).toContainText(/E2E Race/, { timeout: 10000 });
      const viewLinks = page.locator('[id^="view-route-"]');
      await viewLinks.first().click();
      await expect(page.locator('#route-name')).toBeVisible({ timeout: 10000 });
    });

    await test.step('click Download PDF and verify download', async () => {
      const downloadPromise = page.waitForEvent('download');
      await page.locator('#route-download-pdf-btn').click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    });
  });

  test('navigates back to race from route detail', async ({ page }) => {
    await test.step('navigate to route detail', async () => {
      await page.goto('/races');
      await page.locator('[id^="view-race-"]').first().click();
      await expect(page.locator('#race-page-title')).toContainText(/E2E Race/, { timeout: 10000 });
      await page.locator('[id^="view-route-"]').first().click();
      await expect(page.locator('#route-name')).toBeVisible({ timeout: 10000 });
    });

    await test.step('click Back to Race', async () => {
      await page.locator('#back-to-race-link').click();
      await expect(page.locator('#race-page-title')).toContainText(/E2E Race/, { timeout: 10000 });
    });
  });

  test('deletes all routes', async ({ page }) => {
    await test.step('navigate to race detail', async () => {
      await page.goto('/races');
      await page.locator('[id^="view-race-"]').first().click();
      await expect(page.locator('#race-page-title')).toContainText(/E2E Race/, { timeout: 10000 });
    });

    await test.step('click delete all and confirm', async () => {
      await page.locator('#delete-all-routes-btn').click();
      await expect(page.locator('#delete-all-modal-body')).toBeVisible();
      await page.locator('#confirm-delete-all-routes-btn').click();
    });

    await test.step('verify empty state', async () => {
      await expect(page.locator('[data-testid="empty-state"]')).toBeVisible({ timeout: 10000 });
    });
  });
});

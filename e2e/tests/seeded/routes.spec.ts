import { seededTest as test, expect } from '../../fixtures';

test.describe('Routes', () => {
  test('views routes list for a race', async ({ page }) => {
    await test.step('navigate to race', async () => {
      await page.goto('/races');
      await page.getByRole('link', { name: 'View' }).first().click();
      await expect(page.locator('#race-page-title')).toContainText(/E2E Race/, { timeout: 10000 });
    });

    await test.step('navigate to routes list', async () => {
      await page.locator('#view-all-routes-link').click();
      await expect(page.locator('#routes-page-title')).toBeVisible({ timeout: 10000 });
    });
  });

  test('views route detail', async ({ page }) => {
    await test.step('navigate to routes', async () => {
      await page.goto('/races');
      await page.getByRole('link', { name: 'View' }).first().click();
      await page.locator('#view-all-routes-link').click();
    });

    await test.step('click first route', async () => {
      const viewLinks = page.getByRole('link', { name: 'View' });
      if ((await viewLinks.count()) > 0) {
        await viewLinks.first().click();
        await expect(page.locator('#route-name')).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test('renames a route', async ({ page }) => {
    await test.step('navigate to a route', async () => {
      await page.goto('/races');
      await page.getByRole('link', { name: 'View' }).first().click();
      await page.locator('#view-all-routes-link').click();
    });

    await test.step('rename the route', async () => {
      const viewLinks = page.getByRole('link', { name: 'View' });
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

  test('deletes all routes', async ({ page }) => {
    await test.step('navigate to race detail', async () => {
      await page.goto('/races');
      await page.getByRole('link', { name: 'View' }).first().click();
      await expect(page.locator('#race-page-title')).toContainText(/E2E Race/, { timeout: 10000 });
    });

    await test.step('click delete all and confirm', async () => {
      await page.locator('#delete-all-routes-btn').click();
      await expect(page.getByText('This cannot be undone')).toBeVisible();
      await page.locator('#confirm-delete-all-routes-btn').click();
    });

    await test.step('verify empty state', async () => {
      await expect(page.getByText('No routes')).toBeVisible({ timeout: 10000 });
    });
  });
});

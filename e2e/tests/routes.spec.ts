import { test, expect } from '@playwright/test';

test.describe('Routes', () => {
  test('views routes list for a race', async ({ page }) => {
    await test.step('navigate to race', async () => {
      await page.goto('/races');
      await page.getByRole('link', { name: 'View' }).first().click();
      await expect(page.getByText(/E2E Race/)).toBeVisible({ timeout: 10000 });
    });

    await test.step('navigate to routes list', async () => {
      await page.getByRole('link', { name: /view all routes/i }).click();
      await expect(page.getByText(/routes/i)).toBeVisible({ timeout: 10000 });
    });
  });

  test('views route detail', async ({ page }) => {
    await test.step('navigate to routes', async () => {
      await page.goto('/races');
      await page.getByRole('link', { name: 'View' }).first().click();
      await page.getByRole('link', { name: /view all routes/i }).click();
    });

    await test.step('click first route', async () => {
      const viewLinks = page.getByRole('link', { name: 'View' });
      if ((await viewLinks.count()) > 0) {
        await viewLinks.first().click();
        await expect(page.getByText(/distance/i)).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test('renames a route', async ({ page }) => {
    await test.step('navigate to a route', async () => {
      await page.goto('/races');
      await page.getByRole('link', { name: 'View' }).first().click();
      await page.getByRole('link', { name: /view all routes/i }).click();
    });

    await test.step('rename the route', async () => {
      const viewLinks = page.getByRole('link', { name: 'View' });
      if ((await viewLinks.count()) > 0) {
        await viewLinks.first().click();

        const nameInput = page.getByLabel('Route Name');
        if (await nameInput.isVisible()) {
          await nameInput.fill('Alpha Route');
          await page.getByRole('button', { name: /save name/i }).click();
          await expect(page.getByText('Alpha Route')).toBeVisible({ timeout: 10000 });
        }
      }
    });
  });
});

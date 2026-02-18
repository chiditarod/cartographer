import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('displays the dashboard with stats', async ({ page }) => {
    await test.step('navigate to dashboard', async () => {
      await page.goto('/');
    });

    await test.step('verify stats are displayed', async () => {
      await expect(page.getByText('Locations')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Races')).toBeVisible();
    });

    await test.step('verify stat counts are shown', async () => {
      // Seeded data: 6 locations, 1 race
      await expect(page.getByText('6')).toBeVisible();
      await expect(page.getByText('1')).toBeVisible();
    });
  });

  test('navigates to locations via sidebar', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Locations' }).click();
    await expect(page).toHaveURL('/locations');
  });

  test('navigates to races via sidebar', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Races' }).click();
    await expect(page).toHaveURL('/races');
  });
});

import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('displays the dashboard with stats', async ({ page }) => {
    await test.step('navigate to dashboard', async () => {
      await page.goto('/');
    });

    await test.step('verify stats are displayed', async () => {
      await expect(page.locator('#stat-locations')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('#stat-races')).toBeVisible();
    });

    await test.step('verify stat counts are shown', async () => {
      // Seeded data: 6 locations, 1 race
      await expect(page.locator('#stat-locations-count')).toHaveText('6');
      await expect(page.locator('#stat-races-count')).toHaveText('1');
    });
  });

  test('navigates to locations via sidebar', async ({ page }) => {
    await page.goto('/');
    await page.locator('#nav-locations').click();
    await expect(page).toHaveURL('/locations');
  });

  test('navigates to races via sidebar', async ({ page }) => {
    await page.goto('/');
    await page.locator('#nav-races').click();
    await expect(page).toHaveURL('/races');
  });
});

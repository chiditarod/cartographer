import { seededTest as test, expect } from '../../fixtures';

test.describe('Races', () => {
  test('lists seeded races', async ({ page }) => {
    await page.goto('/races');
    await expect(page.locator('[data-testid="races-list"] tbody tr').first()).toBeVisible({ timeout: 10000 });
  });

  test('views race detail with location pool', async ({ page }) => {
    await test.step('navigate to race', async () => {
      await page.goto('/races');
      await page.locator('[id^="view-race-"]').first().click();
    });

    await test.step('verify race details visible', async () => {
      await expect(page.locator('#race-page-title')).toContainText(/E2E Race/, { timeout: 10000 });
      await expect(page.locator('#location-pool-section')).toBeVisible();
    });
  });

  test('creates a new race', async ({ page }) => {
    await test.step('navigate to new race form', async () => {
      await page.goto('/races');
      await page.locator('#new-race-link').click();
      await expect(page).toHaveURL('/races/new');
    });

    await test.step('fill in race details', async () => {
      await page.locator('#race-name').fill('PW Test Race');
      await page.locator('#race-num-stops').fill('3');
      await page.locator('#race-max-teams').fill('50');
      await page.locator('#race-people-per-team').fill('5');
      await page.locator('#race-min-total-distance').fill('3.0');
      await page.locator('#race-max-total-distance').fill('5.0');
      await page.locator('#race-min-leg-distance').fill('0.5');
      await page.locator('#race-max-leg-distance').fill('2.0');
    });

    await test.step('select start and finish locations', async () => {
      await page.locator('#race-start-location').selectOption({ index: 1 });
      await page.locator('#race-finish-location').selectOption({ index: 1 });
    });

    await test.step('select locations for pool', async () => {
      // Check all available location checkboxes in the Location Pool
      const checkboxes = page.locator('input[type="checkbox"]').filter({ has: page.locator('..') });
      const poolCheckboxes = page.locator('label').filter({ hasText: /E2E/ }).locator('input[type="checkbox"]');
      const count = await poolCheckboxes.count();
      for (let i = 0; i < count; i++) {
        await poolCheckboxes.nth(i).check();
      }
    });

    await test.step('submit', async () => {
      await page.locator('#race-submit').click();
      await expect(page.locator('#race-page-title')).toHaveText('PW Test Race', { timeout: 10000 });
    });
  });
});

import path from 'path';
import { freshTest as test, expect } from '../../fixtures';

test.describe('Race Logo Upload', () => {
  test('creates a race with logo file attached', async ({ page }) => {
    const logoPath = path.resolve(__dirname, '../../../public/mock-route-map.png');

    await test.step('create locations', async () => {
      for (const name of ['Logo Start', 'Logo Finish']) {
        await page.goto('/locations/new');
        await page.locator('#name').fill(name);
        await page.locator('#street-address').fill('100 N State St');
        await page.locator('#city').fill('Chicago');
        await page.locator('#state').fill('IL');
        await page.locator('#zip').fill('60602');
        await page.locator('#max-capacity').fill('200');
        await page.locator('#ideal-capacity').fill('100');
        await page.locator('#location-submit').click();
        await expect(page.locator('#location-name')).toHaveText(name, { timeout: 10000 });
      }
    });

    await test.step('create race with logo', async () => {
      await page.goto('/races/new');
      await page.locator('#race-name').fill('Logo Test Race');

      // Upload logo and verify preview appears
      await page.locator('#race-logo').setInputFiles(logoPath);
      await expect(page.getByAltText('Logo preview')).toBeVisible();

      // Verify Remove button appears
      await expect(page.getByText('Remove')).toBeVisible();

      await page.locator('#race-num-stops').fill('1');
      await page.locator('#race-max-teams').fill('5');
      await page.locator('#race-people-per-team').fill('5');
      await page.locator('#race-min-total-distance').fill('1');
      await page.locator('#race-max-total-distance').fill('5');
      await page.locator('#race-min-leg-distance').fill('0.5');
      await page.locator('#race-max-leg-distance').fill('3');

      await page.locator('#race-start-location').selectOption({ label: 'Logo Start' });
      await page.locator('#race-finish-location').selectOption({ label: 'Logo Finish' });

      const checkboxes = page.locator('input[type="checkbox"]');
      const count = await checkboxes.count();
      for (let i = 0; i < count; i++) {
        await checkboxes.nth(i).check();
      }

      await page.locator('#race-submit').click();
      await expect(page.locator('#race-page-title')).toContainText('Logo Test Race', { timeout: 10000 });
    });

    await test.step('remove logo via edit form', async () => {
      await page.getByRole('link', { name: 'Edit' }).click();
      await expect(page.locator('#race-name')).toBeVisible({ timeout: 10000 });

      // Upload a new logo to test remove flow
      await page.locator('#race-logo').setInputFiles(logoPath);
      await expect(page.getByAltText('Logo preview')).toBeVisible();

      // Click Remove and verify preview disappears
      await page.getByText('Remove').click();
      await expect(page.getByAltText('Logo preview')).not.toBeVisible();
    });
  });
});

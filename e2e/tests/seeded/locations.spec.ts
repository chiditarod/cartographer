import { seededTest as test, expect } from '../../fixtures';

test.describe('Locations', () => {
  test('lists seeded locations', async ({ page }) => {
    await page.goto('/locations');
    // Verify the locations table loaded with the expected seed data (6 locations)
    await expect(page.locator('[data-testid="locations-list"] tbody tr')).toHaveCount(6, { timeout: 10000 });
  });

  test('creates a new location', async ({ page }) => {
    await test.step('navigate to new location form', async () => {
      await page.goto('/locations');
      await page.locator('#new-location-link').click();
      await expect(page).toHaveURL('/locations/new');
    });

    await test.step('fill in form fields', async () => {
      await page.locator('#name').fill('PW Test Bar');
      await page.locator('#street-address').fill('123 Test St');
      await page.locator('#city').fill('Chicago');
      await page.locator('#state').fill('IL');
      await page.locator('#zip').fill('60601');
      await page.locator('#max-capacity').fill('200');
      await page.locator('#ideal-capacity').fill('150');
    });

    await test.step('submit and verify', async () => {
      await page.locator('#location-submit').click();
      await expect(page.locator('#location-name')).toHaveText('PW Test Bar', { timeout: 10000 });
    });
  });

  test('views a location detail', async ({ page }) => {
    await page.goto('/locations');
    await page.locator('[id^="view-location-"]').first().click();
    await expect(page.locator('#location-name')).toBeVisible({ timeout: 10000 });
  });

  test('edits a location', async ({ page }) => {
    await page.goto('/locations');
    await page.locator('[id^="view-location-"]').first().click();
    await page.locator('#edit-location-link').click();

    const nameInput = page.locator('#name');
    await nameInput.clear();
    await nameInput.fill('E2E Cobra Updated');
    await page.locator('#location-submit').click();

    await expect(page.locator('#location-name')).toHaveText('E2E Cobra Updated', { timeout: 10000 });
  });
});

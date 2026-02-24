import { freshTest as test, expect } from '../../fixtures';

const LOCATIONS = [
  { name: 'Workflow Bar Alpha', street: '100 N State St', city: 'Chicago', state: 'IL', zip: '60602' },
  { name: 'Workflow Bar Beta', street: '200 W Adams St', city: 'Chicago', state: 'IL', zip: '60606' },
  { name: 'Workflow Bar Gamma', street: '300 S Wacker Dr', city: 'Chicago', state: 'IL', zip: '60606' },
];

test.describe('Full Workflow (fresh DB)', () => {
  test('creates locations, race, geocodes, generates legs and routes', async ({ page }) => {
    // Step 1: Create 3 locations via the UI
    for (const loc of LOCATIONS) {
      await test.step(`create location: ${loc.name}`, async () => {
        await page.goto('/locations/new');
        await page.locator('#name').fill(loc.name);
        await page.locator('#street-address').fill(loc.street);
        await page.locator('#city').fill(loc.city);
        await page.locator('#state').fill(loc.state);
        await page.locator('#zip').fill(loc.zip);
        await page.locator('#max-capacity').fill('200');
        await page.locator('#ideal-capacity').fill('150');
        await page.locator('#location-submit').click();
        await expect(page.locator('#location-name')).toHaveText(loc.name, { timeout: 10_000 });
      });
    }

    // Step 2: Geocode locations from the Locations page
    await test.step('geocode locations', async () => {
      await page.goto('/locations');
      await page.locator('#btn-geocode').click();
      await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible({ timeout: 10_000 });
      await expect(page.locator('[data-testid="op-geocode-progress"] [data-testid="progress-status"][data-status="completed"]')).toBeVisible({ timeout: 30_000 });
    });

    // Step 3: Create a race with all 3 locations
    await test.step('create race', async () => {
      await page.goto('/races/new');

      // Fill race details — wide distance constraints to guarantee route generation
      await page.locator('#race-name').fill('Workflow Test Race');
      await page.locator('#race-num-stops').fill('2');
      await page.locator('#race-max-teams').fill('50');
      await page.locator('#race-people-per-team').fill('5');
      await page.locator('#race-min-total-distance').fill('0.1');
      await page.locator('#race-max-total-distance').fill('20.0');
      await page.locator('#race-min-leg-distance').fill('0.1');
      await page.locator('#race-max-leg-distance').fill('5.0');

      // Select start and finish locations (same location for a loop)
      await page.locator('#race-start-location').selectOption({ label: LOCATIONS[0].name });
      await page.locator('#race-finish-location').selectOption({ label: LOCATIONS[0].name });

      // Check all 3 locations in the Location Pool
      for (const loc of LOCATIONS) {
        const checkbox = page.locator('label').filter({ hasText: loc.name }).locator('input[type="checkbox"]');
        await checkbox.check();
      }

      await page.locator('#race-submit').click();
      await expect(page.locator('#race-page-title')).toHaveText('Workflow Test Race', { timeout: 10_000 });
    });

    // Step 4: Generate legs (MOCK_MAP=true means mock mode is automatic, but enable checkbox too)
    await test.step('generate legs', async () => {
      const mockCheckbox = page.locator('#mock-mode-checkbox');
      if (!(await mockCheckbox.isChecked())) {
        await mockCheckbox.check();
      }

      await page.locator('#btn-generate-legs').click();
      await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible({ timeout: 10_000 });

      await expect(page.locator('[data-testid="op-generate-legs-progress"] [data-testid="progress-status"][data-status="completed"]')).toBeVisible({ timeout: 30_000 });
    });

    // Step 5: Generate routes
    await test.step('generate routes', async () => {
      await page.locator('#btn-generate-routes').click();

      await expect(page.locator('[data-testid="op-generate-routes-progress"] [data-testid="progress-status"][data-status="completed"]')).toBeVisible({ timeout: 30_000 });
    });

    // Step 6: Verify routes were created
    await test.step('verify routes exist', async () => {
      // The routes list on the race detail page should now show route rows
      await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });

      // Verify at least one route view link exists (proves routes were generated)
      await expect(page.locator('[id^="view-route-"]').first()).toBeVisible();
    });
  });
});

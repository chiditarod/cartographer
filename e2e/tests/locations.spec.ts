import { test, expect } from '@playwright/test';

test.describe('Locations', () => {
  test('lists seeded locations', async ({ page }) => {
    await page.goto('/locations');
    await expect(page.getByText(/E2E Cobra Lounge/)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/E2E Output/)).toBeVisible();
    await expect(page.getByText(/E2E Five Star/)).toBeVisible();
  });

  test('creates a new location', async ({ page }) => {
    await test.step('navigate to new location form', async () => {
      await page.goto('/locations');
      await page.getByRole('link', { name: /new location/i }).click();
      await expect(page).toHaveURL('/locations/new');
    });

    await test.step('fill in form fields', async () => {
      await page.getByLabel('Name').fill('PW Test Bar');
      await page.getByLabel('Street Address').fill('123 Test St');
      await page.getByLabel('City').fill('Chicago');
      await page.getByLabel('State').fill('IL');
      await page.getByLabel('Zip').fill('60601');
      await page.getByLabel('Max Capacity').fill('200');
      await page.getByLabel('Ideal Capacity').fill('150');
    });

    await test.step('submit and verify', async () => {
      await page.getByRole('button', { name: /create/i }).click();
      await expect(page.getByText('PW Test Bar')).toBeVisible({ timeout: 10000 });
    });
  });

  test('views a location detail', async ({ page }) => {
    await page.goto('/locations');
    await page.getByRole('link', { name: 'View' }).first().click();
    await expect(page.getByText(/capacity/i)).toBeVisible({ timeout: 10000 });
  });

  test('edits a location', async ({ page }) => {
    await page.goto('/locations');
    await page.getByRole('link', { name: 'View' }).first().click();
    await page.getByRole('link', { name: /edit/i }).click();

    const nameInput = page.getByLabel('Name');
    await nameInput.clear();
    await nameInput.fill('E2E Cobra Updated');
    await page.getByRole('button', { name: /save/i }).click();

    await expect(page.getByText('E2E Cobra Updated')).toBeVisible({ timeout: 10000 });
  });
});

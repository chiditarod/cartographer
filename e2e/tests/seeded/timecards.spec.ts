import path from 'path';
import { seededTest as test, expect } from '../../fixtures';

async function navigateToTimecards(page: import('@playwright/test').Page) {
  await page.goto('/races');
  await page.locator('[id^="view-race-"]').first().click();
  await expect(page.locator('#race-page-title')).toContainText(/E2E Race/, { timeout: 10000 });
  await page.locator('#timecards-link').click();
  await page.waitForURL(/\/timecards$/, { timeout: 10000 });
  await expect(page.locator('#timecards-page-title')).toContainText('Timecards', { timeout: 10000 });
}

async function uploadCsv(page: import('@playwright/test').Page) {
  const csvPath = path.resolve(__dirname, '../../test-data/teams.csv');
  await page.locator('#csv-file-input').setInputFiles(csvPath);
  await page.locator('#upload-csv-btn').click();
  await expect(page.locator('[data-testid="notification"]')).toContainText('Imported 4 teams', { timeout: 10000 });
}

test.describe('Timecards', () => {
  test('navigates to timecards page from race detail', async ({ page }) => {
    await test.step('navigate to race', async () => {
      await page.goto('/races');
      await page.locator('[id^="view-race-"]').first().click();
      await expect(page.locator('#race-page-title')).toContainText(/E2E Race/, { timeout: 10000 });
    });

    await test.step('click timecards link', async () => {
      await page.locator('#timecards-link').click();
      await page.waitForURL(/\/timecards$/, { timeout: 10000 });
      await expect(page.locator('#timecards-page-title')).toContainText('Timecards', { timeout: 10000 });
    });
  });

  test('imports teams via CSV upload', async ({ page }) => {
    await test.step('navigate to timecards page', async () => {
      await navigateToTimecards(page);
    });

    await test.step('upload CSV file', async () => {
      await uploadCsv(page);
    });

    await test.step('verify teams appear in unassigned list', async () => {
      await expect(page.locator('text=Alpha Team')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=Bravo Team')).toBeVisible();
      await expect(page.locator('text=Charlie Team')).toBeVisible();
      await expect(page.locator('text=Delta Team')).toBeVisible();
    });
  });

  test('assigns teams to routes and downloads timecard PDF', async ({ page }) => {
    await test.step('navigate and import', async () => {
      await navigateToTimecards(page);
      await uploadCsv(page);
      // Wait for notification to dismiss
      await page.waitForTimeout(500);
    });

    await test.step('bulk assign teams to first route', async () => {
      await expect(page.locator('text=Alpha Team')).toBeVisible({ timeout: 10000 });

      // Select all unassigned teams
      const checkboxes = page.locator('input[type="checkbox"]');
      const count = await checkboxes.count();
      for (let i = 0; i < count; i++) {
        await checkboxes.nth(i).check();
      }

      // Select the first route
      const selectEl = page.locator('#bulk-assign-route-select');
      await selectEl.selectOption({ index: 1 });

      // Click assign
      await page.locator('#bulk-assign-btn').click();
      // Wait for assignment to complete
      await page.waitForTimeout(1000);
    });

    await test.step('download timecard PDF', async () => {
      const downloadBtn = page.locator('#download-timecards-pdf-btn');
      await expect(downloadBtn).toBeEnabled({ timeout: 10000 });

      const downloadPromise = page.waitForEvent('download');
      await downloadBtn.click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/timecards\.pdf$/);
    });
  });

  test('deletes all teams', async ({ page }) => {
    await test.step('navigate, import, verify teams exist', async () => {
      await navigateToTimecards(page);
      await uploadCsv(page);
      await expect(page.locator('#delete-all-teams-btn')).toBeVisible({ timeout: 10000 });
    });

    await test.step('delete all teams', async () => {
      await page.locator('#delete-all-teams-btn').click();
      await page.locator('#confirm-delete-all-teams').click();
      await expect(page.locator('[data-testid="notification"]')).toContainText('All teams deleted', { timeout: 10000 });
    });
  });
});

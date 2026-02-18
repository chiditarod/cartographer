import { test as base, expect } from '@playwright/test';

const RAILS_URL = 'http://localhost:3099/api/v1';

async function resetDb() {
  const res = await fetch(`${RAILS_URL}/e2e/reset`, { method: 'POST' });
  if (!res.ok) throw new Error(`DB reset failed: ${res.status}`);
}

async function seedDb() {
  const uniqueId = Date.now().toString();
  const res = await fetch(`${RAILS_URL}/e2e/seed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ unique_id: uniqueId }),
  });
  if (!res.ok) throw new Error(`DB seed failed: ${res.status}`);
}

/**
 * Test fixture that resets the DB before each test (no seed data).
 * Use for tests that create their own data from scratch.
 */
export const freshTest = base.extend({
  page: async ({ page }, use) => {
    await resetDb();
    await use(page);
  },
});

/**
 * Test fixture that resets + seeds the DB before each test.
 * Use for tests that depend on the standard E2E seed data.
 */
export const seededTest = base.extend({
  page: async ({ page }, use) => {
    await resetDb();
    await seedDb();
    await use(page);
  },
});

export { expect };

export default async function globalTeardown() {
  // Clean up any leftover test data via the API
  try {
    const res = await fetch('http://localhost:3099/api/v1/e2e/reset', { method: 'POST' });
    if (res.ok) {
      console.log('E2E Global Teardown: Cleaned data via API.');
    }
  } catch {
    // Server may already be shut down — ignore
    console.log('E2E Global Teardown: Server unavailable, skipping cleanup.');
  }
}

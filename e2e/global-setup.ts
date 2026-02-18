export default async function globalSetup() {
  // DB reset/seed is now handled per-test via fixtures (seededTest / freshTest).
  // This global setup is intentionally minimal.
  console.log('E2E Global Setup: Ready (per-test DB management via fixtures).');
}

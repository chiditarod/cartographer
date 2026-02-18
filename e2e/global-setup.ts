import { execSync } from 'child_process';
import path from 'path';

export default async function globalSetup() {
  const projectRoot = path.resolve(__dirname, '..');

  // Note: db:test:prepare is skipped here because the Playwright webServer
  // (Rails) is already connected to the test DB before globalSetup runs.
  // Run `bundle exec rspec` or `RAILS_ENV=test rails db:test:prepare`
  // beforehand if the schema needs updating.

  console.log('E2E Global Setup: Cleaning data...');
  try {
    execSync('RAILS_ENV=test bundle exec rake e2e:clean', {
      cwd: projectRoot,
      stdio: 'pipe',
    });
  } catch {
    // Ignore if no data to clean
  }

  const uniqueId = process.env.TEST_UNIQUE_ID || Date.now().toString();
  console.log(`E2E Global Setup: Seeding data (unique_id: ${uniqueId})...`);
  execSync(`RAILS_ENV=test TEST_UNIQUE_ID=${uniqueId} bundle exec rake e2e:seed`, {
    cwd: projectRoot,
    stdio: 'pipe',
  });

  console.log('E2E Global Setup: Done.');
}

import { execSync } from 'child_process';
import path from 'path';

export default async function globalTeardown() {
  const projectRoot = path.resolve(__dirname, '..');

  console.log('E2E Global Teardown: Cleaning data...');
  try {
    execSync('RAILS_ENV=test bundle exec rake e2e:clean', {
      cwd: projectRoot,
      stdio: 'pipe',
    });
  } catch {
    // Ignore cleanup errors
  }

  console.log('E2E Global Teardown: Done.');
}

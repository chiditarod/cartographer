import { defineConfig } from '@playwright/test';
import path from 'path';

const RAILS_PORT = 3099;
const VITE_PORT = 5199;
const projectRoot = path.resolve(__dirname, '..');

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['html'], ['list']],
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
  timeout: 15_000,
  use: {
    baseURL: `http://localhost:${VITE_PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    navigationTimeout: 10_000,
    actionTimeout: 10_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: [
    {
      command: `cd ${projectRoot} && RAILS_ENV=test MOCK_MAP=true bundle exec rails server -p ${RAILS_PORT}`,
      port: RAILS_PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: `cd ${projectRoot}/frontend && VITE_API_PORT=${RAILS_PORT} npx vite --port ${VITE_PORT}`,
      port: VITE_PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 15_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
});

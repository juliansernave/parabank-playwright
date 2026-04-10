import { defineConfig, devices } from '@playwright/test';
import { baseURL } from './config/environments.js';

export default defineConfig({
  globalSetup: './helpers/setup.helper.js',
  testDir: './tests/ui',
  fullyParallel: true,
  // Prevent test.only from silently narrowing a CI run — fails the job instead
  forbidOnly: !!process.env.CI,
  // Retry once in CI to reduce flakiness noise; no retries locally for fast feedback
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['allure-playwright', { outputFolder: 'allure-results' }],
    // JUnit XML enables GitHub PR check annotations and integrates with most CI dashboards
    ['junit', { outputFile: 'results/junit.xml' }],
  ],
  use: {
    baseURL,
    // Capture screenshot on every failure — available in the Allure report and artifacts
    screenshot: 'only-on-failure',
    // Record video and keep it only when a test fails — balances storage cost with debuggability
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

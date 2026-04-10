import { defineConfig } from '@playwright/test';

export default defineConfig({
  globalSetup: './helpers/setup.helper.js',
  testDir: './tests/api',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 10_000,
  reporter: [
    ['list'],
    ['allure-playwright', { outputFolder: 'allure-results' }],
  ],
  use: {
    // No browser — API tests use Playwright's request context only
    extraHTTPHeaders: {
      Accept: 'application/json',
    },
  },
});

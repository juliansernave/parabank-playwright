/**
 * Global setup helper — seeds the ParaBank database before any test run.
 *
 * Both the local Docker image and the public staging server start with (or may
 * have) a reset database. Calling POST /initializeDB seeds the demo accounts
 * (john/demo, customer 12212, pre-seeded accounts) before any test runs.
 *
 * Also starts the JMS listener so the loan service can process applications.
 *
 * This runs for all environments.
 */
import { request } from '@playwright/test';
import { baseURL } from '../config/environments.js';

export default async function globalSetup() {
  const env = process.env.TEST_ENV || 'staging';
  const context = await request.newContext({ baseURL });

  const response = await context.post('/parabank/services/bank/initializeDB');

  if (response.status() !== 204) {
    const body = await response.text();
    throw new Error(`initializeDB failed: HTTP ${response.status()} — ${body}`);
  }

  console.log(`[setup] ParaBank DB initialized on ${env} (john/demo seeded)`);

  await context.dispose();
}

import { test as base, request as baseRequest } from '@playwright/test';
import { AuthService } from '../api/AuthService.js';
import { AccountService } from '../api/AccountService.js';
import { apiURL } from '../config/environments.js';
import { USERS } from '../data/users.js';

/**
 * Data fixtures — computed test data available to all tests.
 *
 * These fixtures handle runtime data retrieval so test specs stay declarative.
 * Tests that need real account IDs don't call the API directly — they declare
 * the `accountIds` fixture and receive a ready-to-use array.
 *
 * Fixture dependency chain:
 *   authenticatedUser  → calls login, returns { customerId, cookieString }
 *   accountIds         → uses authenticatedUser, returns real account ID array
 *   testAmount         → pure constant, no dependencies
 *   newUserCredentials → pure generator, no dependencies
 */
export const dataFixtures = base.extend({
  /**
   * Perform an API login for john/demo and return session context.
   * Worker-scoped so login happens once per Playwright worker — not per test.
   * All tests in a worker share the same session.
   *
   * Returns: { customerId: number, cookieString: string }
   */
  authenticatedUser: [
    async ({}, use) => {
      const workerRequest = await baseRequest.newContext();
      const authService = new AuthService(workerRequest, apiURL);
      const response = await authService.login(
        USERS.JOHN_SMITH.username,
        USERS.JOHN_SMITH.password
      );
      await authService.assertStatus(response, 200);

      const customer = await authService.json(response);
      const { cookieString } = await authService.getSessionCookie(response);

      await use({
        customerId: customer.id,
        cookieString,
      });

      await workerRequest.dispose();
    },
    { scope: 'worker' },
  ],

  /**
   * Retrieve the list of account IDs for customer 12212 at runtime.
   * Ensures tests always use real, currently-existing account IDs rather than
   * hardcoded values that may become stale if the staging environment resets.
   *
   * Returns: number[]  (array of account IDs)
   */
  accountIds: async ({ request, authenticatedUser }, use) => {
    const accountService = new AccountService(request, apiURL);
    const response = await accountService.getAccountsByCustomer(
      authenticatedUser.customerId
    );
    await accountService.assertStatus(response, 200);

    const accounts = await accountService.json(response);
    // Sort by balance descending so positive-balance accounts come first.
    // This ensures accountIds[0] is always a viable source for transfers.
    accounts.sort((a, b) => (b.balance ?? 0) - (a.balance ?? 0));
    const ids = accounts.map((a) => a.id);

    await use(ids);
  },

  /**
   * A fixed transfer/loan amount used across transaction and loan tests.
   * Declared as a fixture so tests don't hardcode magic numbers.
   * Returns: number (100)
   */
  testAmount: async ({}, use) => {
    await use(100);
  },

  /**
   * Generate fresh credentials for a new user registration test.
   * Uses a timestamp to guarantee uniqueness across parallel runs.
   * Returns: { username: string, password: string, firstName: string, lastName: string }
   */
  newUserCredentials: async ({}, use) => {
    const ts = Date.now();
    await use({
      username: `testuser_${ts}`,
      password: 'Test1234!',
      firstName: 'Test',
      lastName: `User${ts}`,
    });
  },
});

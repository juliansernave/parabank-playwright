import { test as base, request as baseRequest } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { AccountOverviewPage } from '../pages/AccountOverviewPage.js';
import { TransferFundsPage } from '../pages/TransferFundsPage.js';
import { BillPayPage } from '../pages/BillPayPage.js';
import { FindTransactionsPage } from '../pages/FindTransactionsPage.js';
import { RequestLoanPage } from '../pages/RequestLoanPage.js';
import { loginViaApi } from '../helpers/auth.helper.js';
import { USERS } from '../data/users.js';
import { baseURL } from '../config/environments.js';

/**
 * UI fixtures — page object instances scoped to each test.
 *
 * Fixtures are the single composition point for page objects.
 * Tests never instantiate page objects directly.
 *
 * Two categories of fixtures are defined here:
 *
 * 1. Unauthenticated page fixtures (loginPage):
 *    Use the default `page` fixture — no pre-loaded session.
 *    For login page tests only.
 *
 * 2. Authenticated page fixtures (overviewPage, transferPage, etc.):
 *    Use `authenticatedPage` — a browser context pre-loaded with a valid
 *    JSESSIONID cookie obtained via API login. Tests using these fixtures
 *    never touch the login UI.
 *
 * The `authenticatedContext` fixture is worker-scoped: the API login and cookie
 * acquisition happens once per Playwright worker. All tests in that worker share
 * the same authenticated browser context, which keeps the suite fast at scale.
 *
 * Implementation note on `authenticatedContext` scope:
 *   Playwright's built-in `request` fixture is test-scoped and cannot be used
 *   by worker-scoped fixtures. Instead, we create a dedicated APIRequestContext
 *   via `baseRequest.newContext()` — this is the idiomatic pattern for
 *   worker-scoped API calls in Playwright fixtures.
 *
 * Fixture availability exported from this file:
 *   loginPage             — unauthenticated, uses default `page`
 *   authenticatedContext  — BrowserContext with session cookie (worker-scoped)
 *   authenticatedPage     — Page from authenticated context (per-test)
 *   overviewPage          — AccountOverviewPage on authenticatedPage
 *   transferPage          — TransferFundsPage on authenticatedPage
 *   billPayPage           — BillPayPage on authenticatedPage
 *   findTransactionsPage  — FindTransactionsPage on authenticatedPage
 *   requestLoanPage       — RequestLoanPage on authenticatedPage
 */
export const uiFixtures = base.extend({
  // ─── Unauthenticated ───────────────────────────────────────────────────────

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  // ─── Pre-authenticated session (worker-scoped) ─────────────────────────────

  /**
   * A Playwright BrowserContext pre-loaded with the john/demo session cookie.
   * Worker-scoped: the API login call happens once per worker, not per test.
   *
   * We create a standalone APIRequestContext here (not the test-scoped `request`
   * fixture) because worker-scoped fixtures cannot depend on test-scoped fixtures.
   */
  authenticatedContext: [
    async ({ browser }, use) => {
      // Create a short-lived API request context solely for login — independent
      // of the test-scoped `request` fixture which cannot be used here.
      const apiRequest = await baseRequest.newContext({ baseURL });
      const { cookie } = await loginViaApi(apiRequest, USERS.JOHN_SMITH);
      await apiRequest.dispose();

      const context = await browser.newContext({
        storageState: {
          cookies: [cookie],
          origins: [],
        },
      });

      await use(context);
      await context.close();
    },
    { scope: 'worker' },
  ],

  /**
   * A Page from the authenticated context.
   * Each test that requests this fixture gets its own page tab within the
   * worker's shared authenticated browser context.
   */
  authenticatedPage: async ({ authenticatedContext }, use) => {
    const page = await authenticatedContext.newPage();
    await use(page);
    await page.close();
  },

  // ─── Authenticated page objects ────────────────────────────────────────────

  overviewPage: async ({ authenticatedPage }, use) => {
    await use(new AccountOverviewPage(authenticatedPage));
  },

  transferPage: async ({ authenticatedPage }, use) => {
    await use(new TransferFundsPage(authenticatedPage));
  },

  billPayPage: async ({ authenticatedPage }, use) => {
    await use(new BillPayPage(authenticatedPage));
  },

  findTransactionsPage: async ({ authenticatedPage }, use) => {
    await use(new FindTransactionsPage(authenticatedPage));
  },

  requestLoanPage: async ({ authenticatedPage }, use) => {
    await use(new RequestLoanPage(authenticatedPage));
  },
});

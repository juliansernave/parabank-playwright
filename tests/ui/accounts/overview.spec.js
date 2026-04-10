import { test, expect } from '../../../fixtures/index.js';
import { ROUTES } from '../../../data/constants.js';

/**
 * Accounts Overview UI tests.
 *
 * All tests except TC-ACCT-UI-004 use storageState via the `overviewPage` fixture —
 * no login UI interaction occurs in these tests.
 *
 * TC-ACCT-UI-004 intentionally uses a fresh context with NO storageState to verify
 * that unauthenticated access is redirected to the login page.
 *
 * Test data assumptions:
 *   - john/demo has at least one account in the staging environment.
 *   - The table structure renders balances in the second <td> of each row.
 *   - The footer row contains a "Total" label and the sum balance.
 */
test.describe('Accounts Overview', () => {
  test('TC-ACCT-UI-001: accounts overview heading is visible after login @smoke @ui', async ({
    overviewPage,
  }) => {
    await overviewPage.navigate();

    await expect(overviewPage.heading).toBeVisible();
    const rowCount = await overviewPage.getAccountRowCount();
    expect(rowCount).toBeGreaterThanOrEqual(1);
  });

  test('TC-ACCT-UI-002: account number links navigate to account activity @smoke @ui', async ({
    overviewPage,
    authenticatedPage,
  }) => {
    await overviewPage.navigate();

    // Retrieve the first account ID from the table
    const ids = await overviewPage.getAccountIds();
    expect(ids.length).toBeGreaterThanOrEqual(1);

    const firstId = ids[0];
    await overviewPage.clickAccountLink(firstId);

    // After clicking the link, the URL should change to the account activity page
    // ParaBank uses /activity.htm?id=<accountId>
    await expect(authenticatedPage).toHaveURL(/activity\.htm/);
  });

  test('TC-ACCT-UI-003: total balance equals sum of all account balances @regression @ui', async ({
    overviewPage,
  }) => {
    await overviewPage.navigate();

    const individualBalances = await overviewPage.getAllBalances();
    const displayedTotal = await overviewPage.getDisplayedTotalBalance();

    // Sum all individual balances and round to 2 decimal places to avoid
    // floating-point precision errors when comparing to the displayed total.
    const computedSum = Math.round(
      individualBalances.reduce((sum, b) => sum + b, 0) * 100
    ) / 100;

    const roundedDisplayed = Math.round(displayedTotal * 100) / 100;

    expect(computedSum).toBeCloseTo(roundedDisplayed, 2);
  });

  test(
    'TC-ACCT-UI-004: unauthenticated access to /overview.htm redirects to login @regression @ui',
    async ({ browser }) => {
      // The public staging server does not enforce auth redirects on REST routes —
      // this test is only meaningful against the local Docker instance.
      test.skip(
        process.env.TEST_ENV === 'staging',
        'Staging server does not redirect unauthenticated access to /overview.htm'
      );
      // Deliberately create a fresh context with NO storageState —
      // this simulates an unauthenticated user hitting the overview URL directly.
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto(ROUTES.OVERVIEW);

      // ParaBank redirects unauthenticated requests back to the login page.
      await expect(page).toHaveURL(new RegExp(ROUTES.LOGIN));

      await page.close();
      await context.close();
    }
  );
});

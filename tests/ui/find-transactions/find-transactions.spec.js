import { test, expect } from '../../../fixtures/index.js';
import { today, daysAgo } from '../../../helpers/date.helper.js';

/**
 * Find Transactions UI tests.
 *
 * All tests use the `findTransactionsPage` fixture for the UI interaction.
 * The `accountIds` data fixture provides real account IDs at runtime.
 *
 * TC-FIND-UI-001 and TC-FIND-UI-004 use the API service fixtures to ensure
 * known transaction data exists before searching. Both tests declare
 * `authenticatedUser` to ensure the worker-level API session is active, which
 * allows `accountService` and `transactionService` (test-scoped) to operate
 * against the same authenticated cookie jar.
 *
 * TC-FIND-UI-004 retrieves a real transaction ID via the API — no transaction
 * ID is ever hardcoded in this test file.
 *
 * Test data assumptions:
 *   - john/demo's first account has at least one existing transaction (TC-FIND-UI-002).
 *   - A search for amount "9999999" returns no results (TC-FIND-UI-003).
 */
test.describe('Find Transactions', () => {
  test('TC-FIND-UI-001: search by amount returns matching transactions @smoke @ui', async ({
    findTransactionsPage,
    accountIds,
    testAmount,
    accountService,
    transactionService,
    authenticatedUser,
  }) => {
    // authenticatedUser ensures the worker-level API session is active.
    // accountIds[1] may be the same as accountIds[0] for single-account users.
    const fromId = accountIds[0];
    const toId = accountIds[1] ?? accountIds[0];

    // Create a transfer via the API so we have a transaction at testAmount to search
    await transactionService.transfer(fromId, toId, testAmount);

    // Search the UI for transactions matching testAmount on the from account
    await findTransactionsPage.navigate();
    await findTransactionsPage.selectAccount(fromId);
    await findTransactionsPage.searchByAmount(testAmount);

    const rowCount = await findTransactionsPage.getResultRowCount();
    expect(rowCount).toBeGreaterThanOrEqual(1);
  });

  test('TC-FIND-UI-002: search by date range returns transactions within range @regression @ui', async ({
    findTransactionsPage,
    accountIds,
  }) => {
    await findTransactionsPage.navigate();
    await findTransactionsPage.selectAccount(accountIds[0]);

    // 30-day range — encompasses all existing account history
    await findTransactionsPage.searchByDateRange(daysAgo(30), today());

    const rowCount = await findTransactionsPage.getResultRowCount();
    expect(rowCount).toBeGreaterThanOrEqual(1);
  });

  test('TC-FIND-UI-003: search with no matching results shows empty state @regression @ui', async ({
    findTransactionsPage,
    accountIds,
  }) => {
    await findTransactionsPage.navigate();
    await findTransactionsPage.selectAccount(accountIds[0]);

    // An extreme amount that will never match any real transaction
    await findTransactionsPage.searchByAmount('9999999');

    // ParaBank renders an empty results table (0 rows) rather than a visible
    // error element when a search returns no matches.
    await expect(findTransactionsPage.resultRows).toHaveCount(0);
  });

  test('TC-FIND-UI-004: search by transaction ID returns that specific transaction @regression @ui', async ({
    findTransactionsPage,
    accountIds,
    transactionService,
    authenticatedUser,
  }) => {
    // authenticatedUser is declared to ensure the API session cookie is active.
    // Retrieve real transactions via the API — never hardcode a transaction ID.
    const targetAccountId = accountIds[0];

    const txnsResp = await transactionService.getTransactionsByAccount(targetAccountId);
    await transactionService.assertStatus(txnsResp, 200);
    const transactions = await transactionService.json(txnsResp);

    if (!transactions || transactions.length === 0) {
      test.skip(true, 'No transactions found for account — run TC-FIND-UI-001 first');
    }

    const realTransactionId = transactions[0].id;

    // Search the UI for this specific transaction by its ID
    await findTransactionsPage.navigate();
    await findTransactionsPage.selectAccount(targetAccountId);
    await findTransactionsPage.searchByTransactionId(realTransactionId);

    // Exactly one row should appear for a specific transaction ID
    const rowCount = await findTransactionsPage.getResultRowCount();
    expect(rowCount).toBe(1);

    // The result's ID link text should match what we searched for
    const resultIds = await findTransactionsPage.getResultTransactionIds();
    expect(resultIds[0]).toBe(String(realTransactionId));
  });
});

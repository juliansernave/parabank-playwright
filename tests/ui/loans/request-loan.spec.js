import { test, expect } from '../../../fixtures/index.js';
import { ROUTES } from '../../../data/constants.js';

/**
 * Request Loan UI tests.
 *
 * All tests use the `requestLoanPage` fixture which provides an authenticated page.
 * Account IDs are retrieved at runtime via `accountIds`.
 *
 * TC-LOAN-UI-004 requires a full flow: submit a loan, capture the new account
 * number from the confirmation page, navigate to overview, and verify the new
 * account appears. The new account ID is captured from the result panel link
 * rather than hardcoded.
 *
 * Test data assumptions:
 *   - john/demo has sufficient account history for loan approval with a down payment.
 *   - A loan with $0 down payment is denied by ParaBank's credit policy.
 *   - ParaBank's loan result panel is rendered asynchronously after form submission.
 */
test.describe('Request Loan', () => {
  // Loan processing is asynchronous (JMS-backed AJAX) — give each test extra
  // headroom beyond the default 30 s to handle slow staging responses.
  test.setTimeout(60_000);
  test('TC-LOAN-UI-001: loan with sufficient down payment results in approval @smoke @ui', async ({
    requestLoanPage,
    accountIds,
  }) => {
    await requestLoanPage.navigate();

    // 2000 loan with 100 down payment — within the approval threshold
    await requestLoanPage.applyForLoan('2000', '100', accountIds[0]);

    await expect(requestLoanPage.approvalHeading).toBeVisible();
    expect(await requestLoanPage.isApproved()).toBe(true);
  });

  test('TC-LOAN-UI-002: loan with zero down payment results in denial @regression @ui', async ({
    requestLoanPage,
    accountIds,
  }) => {
    await requestLoanPage.navigate();

    // A $0 down payment triggers ParaBank's denial policy
    await requestLoanPage.applyForLoan('2000', '0', accountIds[0]);

    await expect(requestLoanPage.denialHeading).toBeVisible();
    expect(await requestLoanPage.isApproved()).toBe(false);
  });

  test('TC-LOAN-UI-003: missing loan amount shows validation error @regression @ui', async ({
    requestLoanPage,
    accountIds,
  }) => {
    await requestLoanPage.navigate();

    // Submit without filling the loan amount — only the down payment is provided
    await requestLoanPage.submitWithoutLoanAmount('100', accountIds[0]);

    await expect(requestLoanPage.loanAmountError).toBeVisible();
  });

  test('TC-LOAN-UI-004: approved loan account appears in accounts overview @regression @ui', async ({
    requestLoanPage,
    overviewPage,
    accountIds,
  }) => {
    // Step 1 — Submit the loan and capture the new account number
    await requestLoanPage.navigate();
    await requestLoanPage.applyForLoan('1000', '100', accountIds[0]);

    await expect(requestLoanPage.approvalHeading).toBeVisible();

    const newAccountId = await requestLoanPage.getNewAccountId();
    expect(newAccountId).toBeTruthy();

    // Step 2 — Navigate to the accounts overview
    await overviewPage.navigate();

    // Step 3 — Verify the new account ID appears in the overview table
    const accountIdsInOverview = await overviewPage.getAccountIds();
    expect(accountIdsInOverview).toContain(newAccountId);
  });
});

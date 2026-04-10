# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: loans/request-loan.spec.js >> Request Loan >> TC-LOAN-UI-003: missing loan amount shows validation error @regression @ui
- Location: tests/ui/loans/request-loan.spec.js:50:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('#amount-error')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('#amount-error')

```

# Test source

```ts
  1  | import { test, expect } from '../../../fixtures/index.js';
  2  | import { ROUTES } from '../../../data/constants.js';
  3  | 
  4  | /**
  5  |  * Request Loan UI tests.
  6  |  *
  7  |  * All tests use the `requestLoanPage` fixture which provides an authenticated page.
  8  |  * Account IDs are retrieved at runtime via `accountIds`.
  9  |  *
  10 |  * TC-LOAN-UI-004 requires a full flow: submit a loan, capture the new account
  11 |  * number from the confirmation page, navigate to overview, and verify the new
  12 |  * account appears. The new account ID is captured from the result panel link
  13 |  * rather than hardcoded.
  14 |  *
  15 |  * Test data assumptions:
  16 |  *   - john/demo has sufficient account history for loan approval with a down payment.
  17 |  *   - A loan with $0 down payment is denied by ParaBank's credit policy.
  18 |  *   - ParaBank's loan result panel is rendered asynchronously after form submission.
  19 |  */
  20 | test.describe('Request Loan', () => {
  21 |   // Loan processing is asynchronous (JMS-backed AJAX) — give each test extra
  22 |   // headroom beyond the default 30 s to handle slow staging responses.
  23 |   test.setTimeout(60_000);
  24 |   test('TC-LOAN-UI-001: loan with sufficient down payment results in approval @smoke @ui', async ({
  25 |     requestLoanPage,
  26 |     accountIds,
  27 |   }) => {
  28 |     await requestLoanPage.navigate();
  29 | 
  30 |     // 2000 loan with 100 down payment — within the approval threshold
  31 |     await requestLoanPage.applyForLoan('2000', '100', accountIds[0]);
  32 | 
  33 |     await expect(requestLoanPage.approvalHeading).toBeVisible();
  34 |     expect(await requestLoanPage.isApproved()).toBe(true);
  35 |   });
  36 | 
  37 |   test('TC-LOAN-UI-002: loan with zero down payment results in denial @regression @ui', async ({
  38 |     requestLoanPage,
  39 |     accountIds,
  40 |   }) => {
  41 |     await requestLoanPage.navigate();
  42 | 
  43 |     // A $0 down payment triggers ParaBank's denial policy
  44 |     await requestLoanPage.applyForLoan('2000', '0', accountIds[0]);
  45 | 
  46 |     await expect(requestLoanPage.denialHeading).toBeVisible();
  47 |     expect(await requestLoanPage.isApproved()).toBe(false);
  48 |   });
  49 | 
  50 |   test('TC-LOAN-UI-003: missing loan amount shows validation error @regression @ui', async ({
  51 |     requestLoanPage,
  52 |     accountIds,
  53 |   }) => {
  54 |     await requestLoanPage.navigate();
  55 | 
  56 |     // Submit without filling the loan amount — only the down payment is provided
  57 |     await requestLoanPage.submitWithoutLoanAmount('100', accountIds[0]);
  58 | 
> 59 |     await expect(requestLoanPage.loanAmountError).toBeVisible();
     |                                                   ^ Error: expect(locator).toBeVisible() failed
  60 |   });
  61 | 
  62 |   test('TC-LOAN-UI-004: approved loan account appears in accounts overview @regression @ui', async ({
  63 |     requestLoanPage,
  64 |     overviewPage,
  65 |     accountIds,
  66 |   }) => {
  67 |     // Step 1 — Submit the loan and capture the new account number
  68 |     await requestLoanPage.navigate();
  69 |     await requestLoanPage.applyForLoan('1000', '100', accountIds[0]);
  70 | 
  71 |     await expect(requestLoanPage.approvalHeading).toBeVisible();
  72 | 
  73 |     const newAccountId = await requestLoanPage.getNewAccountId();
  74 |     expect(newAccountId).toBeTruthy();
  75 | 
  76 |     // Step 2 — Navigate to the accounts overview
  77 |     await overviewPage.navigate();
  78 | 
  79 |     // Step 3 — Verify the new account ID appears in the overview table
  80 |     const accountIdsInOverview = await overviewPage.getAccountIds();
  81 |     expect(accountIdsInOverview).toContain(newAccountId);
  82 |   });
  83 | });
  84 | 
```
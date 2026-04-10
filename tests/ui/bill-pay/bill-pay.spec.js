import { test, expect } from '../../../fixtures/index.js';

/**
 * Bill Pay UI tests.
 *
 * All tests use the `billPayPage` fixture which provides an authenticated page.
 * Account IDs are retrieved at runtime via `accountIds`.
 *
 * Test data assumptions:
 *   - john/demo has at least one account to act as the payment source.
 *   - ParaBank's bill-pay validation uses the #validationErrors list and/or
 *     span[id="input_error_*"] elements depending on which fields are invalid.
 *
 * The `VALID_PAYEE` constant defines a complete, valid payee used as the
 * baseline for all partial-submission tests so only the relevant field changes
 * between test cases.
 */

/** A complete valid payee record — used as the baseline for all tests. */
const VALID_PAYEE = {
  payeeName: 'Acme Utilities',
  address: '123 Main St',
  city: 'Springfield',
  state: 'IL',
  zip: '62701',
  phone: '5555550100',
  accountNumber: '99887766',
  amount: '50',
};

test.describe('Bill Pay', () => {
  test('TC-BILL-UI-001: successful bill payment with all fields shows confirmation @smoke @ui', async ({
    billPayPage,
    accountIds,
  }) => {
    await billPayPage.navigate();

    await billPayPage.payBill({
      ...VALID_PAYEE,
      fromAccountId: accountIds[0],
    });

    await expect(billPayPage.confirmationHeading).toBeVisible();

    const confirmationText = await billPayPage.getConfirmationText();
    expect(confirmationText).toContain(VALID_PAYEE.payeeName);
    expect(confirmationText).toContain(VALID_PAYEE.amount);
  });

  test('TC-BILL-UI-002: missing payee name shows validation error @regression @ui', async ({
    billPayPage,
    accountIds,
  }) => {
    await billPayPage.navigate();

    // Submit with every field filled except the payee name
    await billPayPage.submitPartialForm({
      // payeeName intentionally omitted
      address: VALID_PAYEE.address,
      city: VALID_PAYEE.city,
      state: VALID_PAYEE.state,
      zip: VALID_PAYEE.zip,
      phone: VALID_PAYEE.phone,
      accountNumber: VALID_PAYEE.accountNumber,
      amount: VALID_PAYEE.amount,
      fromAccountId: accountIds[0],
    });

    // ParaBank renders validation errors inside #validationErrors or as span.error
    // For payee name, the error appears in the #validationErrors list
    await expect(billPayPage.errors.validationList).toBeVisible();
  });

  test('TC-BILL-UI-003: mismatched account number fields show validation error @regression @ui', async ({
    billPayPage,
    accountIds,
  }) => {
    await billPayPage.navigate();

    await billPayPage.payBillWithMismatch({
      ...VALID_PAYEE,
      accountNumber: '11111111',
      verifyAccountNumber: '22222222', // intentionally different
      fromAccountId: accountIds[0],
    });

    // Mismatch errors render as a field-level span (input_error_verifyAccount),
    // not in the #validationErrors summary list used for missing required fields.
    await expect(billPayPage.errors.fieldError('verifyAccount')).toBeVisible();
  });

  test('TC-BILL-UI-004: missing amount field shows validation error @regression @ui', async ({
    billPayPage,
    accountIds,
  }) => {
    await billPayPage.navigate();

    // Submit with every field filled except the amount
    await billPayPage.submitPartialForm({
      payeeName: VALID_PAYEE.payeeName,
      address: VALID_PAYEE.address,
      city: VALID_PAYEE.city,
      state: VALID_PAYEE.state,
      zip: VALID_PAYEE.zip,
      phone: VALID_PAYEE.phone,
      accountNumber: VALID_PAYEE.accountNumber,
      // amount intentionally omitted
      fromAccountId: accountIds[0],
    });

    await expect(billPayPage.errors.validationList).toBeVisible();
  });
});

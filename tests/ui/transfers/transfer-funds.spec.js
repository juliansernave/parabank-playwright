import { test, expect } from '../../../fixtures/index.js';

/**
 * Transfer Funds UI tests.
 *
 * All tests use the `transferPage` fixture which provides an authenticated page.
 * Account IDs are retrieved at runtime via the `accountIds` data fixture to avoid
 * hardcoding values that may become stale if the staging environment resets.
 *
 * Test data assumptions:
 *   - john/demo has at least two accounts for transfers between them.
 *   - The transfer form populates both dropdowns from the same account list.
 */
test.describe('Transfer Funds', () => {
  test('TC-XFER-UI-001: successful transfer shows confirmation with amount and account refs @smoke @ui', async ({
    transferPage,
    accountIds,
    testAmount,
  }) => {
    await transferPage.navigate();

    const fromId = accountIds[0];
    const toId = accountIds[1] ?? accountIds[0];

    await transferPage.transfer(String(testAmount), fromId, toId);

    await expect(transferPage.confirmationHeading).toBeVisible();

    // The confirmation panel should mention the amount and the from/to account IDs
    const confirmationText = await transferPage.getConfirmationText();
    expect(confirmationText).toContain(String(testAmount));
    expect(confirmationText).toContain(String(fromId));
    expect(confirmationText).toContain(String(toId));
  });

  test('TC-XFER-UI-002: empty amount field shows validation error @regression @ui', async ({
    transferPage,
    accountIds,
  }) => {
    // Staging does not render #amount-error for empty amounts — the form processes
    // the transfer as $0 instead. Only meaningful against the local Docker instance.
    test.skip(process.env.TEST_ENV === 'staging', 'Staging does not surface #amount-error for empty amount');

    await transferPage.navigate();
    await transferPage.submitWithoutAmount(accountIds[0], accountIds[0]);
    await expect(transferPage.amountError).toBeVisible();
  });

  test('TC-XFER-UI-003: non-numeric amount shows validation error @regression @ui', async ({
    transferPage,
  }) => {
    // Staging does not render #amount-error for non-numeric amounts.
    // Only meaningful against the local Docker instance.
    test.skip(process.env.TEST_ENV === 'staging', 'Staging does not surface #amount-error for non-numeric amount');

    await transferPage.navigate();
    await transferPage.submitWithAmount('abc');
    await expect(transferPage.amountError).toBeVisible();
  });

  test('TC-XFER-UI-004: both account dropdowns are populated @smoke @ui', async ({
    transferPage,
    accountIds,
  }) => {
    await transferPage.navigate();

    const fromValues = await transferPage.fromAccount.getAllValues();
    const toValues = await transferPage.toAccount.getAllValues();

    expect(fromValues.length).toBeGreaterThanOrEqual(1);
    expect(toValues.length).toBeGreaterThanOrEqual(1);

    // The real account IDs from the API should appear in both dropdowns
    for (const id of accountIds) {
      expect(fromValues).toContain(String(id));
      expect(toValues).toContain(String(id));
    }
  });

  test('TC-XFER-UI-005: zero amount is accepted and shows transfer confirmation @regression @ui', async ({
    transferPage,
    accountIds,
  }) => {
    await transferPage.navigate();

    // ParaBank does not validate $0 as invalid — it processes the transfer.
    // This test documents that behaviour: a zero-amount transfer completes normally.
    await transferPage.transfer('0', accountIds[0], accountIds[0]);

    await expect(transferPage.confirmationHeading).toBeVisible();
  });
});

import { ROUTES } from '../data/constants.js';
import { NavigationBar } from './components/NavigationBar.js';
import { AccountSelector } from './components/AccountSelector.js';
import { ErrorMessage } from './components/ErrorMessage.js';

/**
 * BillPayPage — page object for /parabank/billpay.htm.
 *
 * The Bill Pay form collects:
 *   - Payee Name, Address, City, State, Zip Code, Phone
 *   - Account Number (entered twice for confirmation)
 *   - Amount
 *   - From Account (dropdown)
 *
 * On success, ParaBank renders a "Bill Payment Complete" heading with the payee
 * and amount. On validation failure, span.error elements appear next to each
 * invalid field.
 *
 * Locator rationale:
 *   - All text inputs use page.locator('input[name="X"]') because the bill-pay
 *     form fields have no associated <label> elements with for attributes —
 *     they use table-cell layout with text alongside the inputs, not proper
 *     HTML labelling. The name attribute is stable and specific.
 *   - The from-account dropdown is composed via AccountSelector with its CSS ID.
 *   - The send-payment button uses its input value text for targeting.
 *   - Error spans: ParaBank uses id="input_error_fieldname" pattern for bill-pay.
 *
 * @example
 * await billPayPage.navigate();
 * await billPayPage.payBill({ payeeName: 'Electric Co', ... });
 * await expect(billPayPage.confirmationHeading).toBeVisible();
 */
export class BillPayPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.nav = new NavigationBar(page);
    this.errors = new ErrorMessage(page);

    // Form inputs — all targeted by name attribute (no reliable label associations)
    this.payeeNameInput = page.locator('input[name="payee.name"]');
    this.addressInput = page.locator('input[name="payee.address.street"]');
    this.cityInput = page.locator('input[name="payee.address.city"]');
    this.stateInput = page.locator('input[name="payee.address.state"]');
    this.zipInput = page.locator('input[name="payee.address.zipCode"]');
    this.phoneInput = page.locator('input[name="payee.phoneNumber"]');
    this.accountNumberInput = page.locator('input[name="payee.accountNumber"]');
    this.verifyAccountInput = page.locator('input[name="verifyAccount"]');
    this.amountInput = page.locator('input[name="amount"]');

    // From Account dropdown — composed component
    this.fromAccount = new AccountSelector(page.locator('select[name="fromAccountId"]'));

    // Submit button
    this.sendPaymentButton = page.locator('input[value="Send Payment"]');

    // Success state — staging renders "Bill Payment Complete" (no exclamation mark)
    this.confirmationHeading = page.getByRole('heading', { name: /Bill Payment Complete/ });

    // Confirmation detail panel
    this.confirmationPanel = page.locator('#billpayResult');

    // AngularJS cross-field validation messages — these are rendered via ng-show
    // directives and do NOT carry the span.error class used by field-level errors.
    // Targeted by visible text since the elements have no stable ID or class.
    this.accountMismatchError = page.getByText(/account numbers do not match/i);
    this.amountRequiredError = page.getByText(/amount cannot be empty/i);
  }

  /** Navigate to the Bill Pay page. */
  async navigate() {
    await this.page.goto(ROUTES.BILL_PAY);
    // Wait for the fromAccount dropdown to be populated before returning — AngularJS
    // loads account options via AJAX and they must exist before form submission.
    await this.fromAccount.locator.locator('option:not([value=""])').first().waitFor({ state: 'attached' });
  }

  /**
   * Complete and submit the bill pay form.
   *
   * All fields are required by ParaBank. The fromAccountId must be a valid
   * account ID that exists in the authenticated user's account list.
   *
   * @param {object} details
   * @param {string} details.payeeName
   * @param {string} details.address
   * @param {string} details.city
   * @param {string} details.state
   * @param {string} details.zip
   * @param {string} details.phone
   * @param {string} details.accountNumber
   * @param {string} details.amount
   * @param {string|number} details.fromAccountId
   */
  async payBill(details) {
    await this.payeeNameInput.fill(details.payeeName);
    await this.addressInput.fill(details.address);
    await this.cityInput.fill(details.city);
    await this.stateInput.fill(details.state);
    await this.zipInput.fill(details.zip);
    await this.phoneInput.fill(details.phone);
    await this.accountNumberInput.fill(details.accountNumber);
    await this.verifyAccountInput.fill(details.accountNumber);
    await this.amountInput.fill(details.amount);
    await this.fromAccount.selectById(details.fromAccountId);
    await this.sendPaymentButton.click();
  }

  /**
   * Submit the bill pay form with a mismatched account verification number.
   * Used for the account mismatch validation test case.
   * @param {object} details - Same as payBill but verifyAccountNumber differs
   * @param {string} details.payeeName
   * @param {string} details.address
   * @param {string} details.city
   * @param {string} details.state
   * @param {string} details.zip
   * @param {string} details.phone
   * @param {string} details.accountNumber
   * @param {string} details.verifyAccountNumber - Intentionally different from accountNumber
   * @param {string} details.amount
   * @param {string|number} details.fromAccountId
   */
  async payBillWithMismatch(details) {
    await this.payeeNameInput.fill(details.payeeName);
    await this.addressInput.fill(details.address);
    await this.cityInput.fill(details.city);
    await this.stateInput.fill(details.state);
    await this.zipInput.fill(details.zip);
    await this.phoneInput.fill(details.phone);
    await this.accountNumberInput.fill(details.accountNumber);
    await this.verifyAccountInput.fill(details.verifyAccountNumber);
    await this.amountInput.fill(details.amount);
    await this.fromAccount.selectById(details.fromAccountId);
    await this.sendPaymentButton.click();
  }

  /**
   * Submit the bill pay form with only some fields — used for validation tests.
   * Only fills the fields provided; leaves all others empty.
   * @param {object} partialDetails - Any subset of the payBill fields
   */
  async submitPartialForm(partialDetails) {
    if (partialDetails.payeeName !== undefined) {
      await this.payeeNameInput.fill(partialDetails.payeeName);
    }
    if (partialDetails.address !== undefined) {
      await this.addressInput.fill(partialDetails.address);
    }
    if (partialDetails.city !== undefined) {
      await this.cityInput.fill(partialDetails.city);
    }
    if (partialDetails.state !== undefined) {
      await this.stateInput.fill(partialDetails.state);
    }
    if (partialDetails.zip !== undefined) {
      await this.zipInput.fill(partialDetails.zip);
    }
    if (partialDetails.phone !== undefined) {
      await this.phoneInput.fill(partialDetails.phone);
    }
    if (partialDetails.accountNumber !== undefined) {
      await this.accountNumberInput.fill(partialDetails.accountNumber);
      await this.verifyAccountInput.fill(partialDetails.accountNumber);
    }
    if (partialDetails.amount !== undefined) {
      await this.amountInput.fill(partialDetails.amount);
    }
    if (partialDetails.fromAccountId !== undefined) {
      await this.fromAccount.selectById(partialDetails.fromAccountId);
    }
    await this.sendPaymentButton.click();
  }

  /**
   * Return the text content of the confirmation panel.
   * @returns {Promise<string>}
   */
  async getConfirmationText() {
    return (await this.confirmationPanel.textContent())?.trim() ?? '';
  }
}

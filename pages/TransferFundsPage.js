import { ROUTES } from '../data/constants.js';
import { NavigationBar } from './components/NavigationBar.js';
import { AccountSelector } from './components/AccountSelector.js';

/**
 * TransferFundsPage — page object for /parabank/transfer.htm.
 *
 * The transfer form has:
 *   - An amount input
 *   - A "From Account" dropdown (#fromAccountId)
 *   - A "To Account" dropdown (#toAccountId)
 *   - A submit button
 *
 * On success, ParaBank renders a confirmation section with the transfer details.
 * On validation failure, span.error messages appear adjacent to the invalid inputs.
 *
 * Locator rationale:
 *   - Amount input: getByRole('textbox', { name: 'Amount' }) is preferred but
 *     ParaBank's label association is inconsistent; page.locator('#amount') is
 *     the reliable fallback since the element has a stable ID.
 *   - Account dropdowns: composed via AccountSelector using their element IDs.
 *   - Submit button: getByRole('button', { name: 'Transfer' }) — matches the
 *     visible label on the submit input.
 *   - Confirmation heading: identifies when the success panel is visible.
 *   - Error spans: scoped by input id using span[id] pattern that ParaBank uses.
 *
 * @example
 * await transferPage.navigate();
 * await transferPage.transfer('100', fromAccountId, toAccountId);
 * await expect(transferPage.confirmationHeading).toBeVisible();
 */
export class TransferFundsPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.nav = new NavigationBar(page);

    // Amount input — ParaBank assigns id="amount" to this field
    this.amountInput = page.locator('#amount');

    // Account selectors — composed components scoped to their select element IDs
    this.fromAccount = new AccountSelector(page.locator('#fromAccountId'));
    this.toAccount = new AccountSelector(page.locator('#toAccountId'));

    // Submit button — ParaBank renders this as <input type="submit"> inside a form
    // value="Transfer" is the visible label
    this.transferButton = page.locator('input[value="Transfer"]');

    // Success state — the confirmation heading appears after a successful transfer
    this.confirmationHeading = page.getByRole('heading', { name: 'Transfer Complete!' });

    // Confirmation detail paragraphs (contain amount, account refs)
    this.confirmationPanel = page.locator('#showResult');

    // Validation errors — ParaBank renders span.error with id="amount-error" etc.
    this.amountError = page.locator('#amount-error');
  }

  /** Navigate to the Transfer Funds page. */
  async navigate() {
    await this.page.goto(ROUTES.TRANSFER);
  }

  /**
   * Fill the amount field, select accounts, and submit the transfer form.
   * @param {string} amount - The transfer amount (e.g. "100")
   * @param {string|number} fromAccountId - Source account ID
   * @param {string|number} toAccountId - Destination account ID
   */
  async transfer(amount, fromAccountId, toAccountId) {
    await this.amountInput.fill(amount);
    await this.fromAccount.selectById(fromAccountId);
    await this.toAccount.selectById(toAccountId);
    await this.transferButton.click();
  }

  /**
   * Submit the transfer form without filling the amount.
   * Used for empty-amount validation tests.
   * @param {string|number} fromAccountId
   * @param {string|number} toAccountId
   */
  async submitWithoutAmount(fromAccountId, toAccountId) {
    await this.fromAccount.selectById(fromAccountId);
    await this.toAccount.selectById(toAccountId);
    await this.transferButton.click();
  }

  /**
   * Fill only the amount field and submit — used for validation tests that
   * don't require account selection.
   * @param {string} amount
   */
  async submitWithAmount(amount) {
    await this.amountInput.fill(amount);
    await this.transferButton.click();
  }

  /**
   * Return the full text of the confirmation result panel.
   * Tests use this to verify the amount and account references appear.
   * @returns {Promise<string>}
   */
  async getConfirmationText() {
    return (await this.confirmationPanel.textContent())?.trim() ?? '';
  }
}

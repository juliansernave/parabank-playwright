import { ROUTES } from '../data/constants.js';
import { NavigationBar } from './components/NavigationBar.js';
import { AccountSelector } from './components/AccountSelector.js';

/**
 * RequestLoanPage — page object for /parabank/requestloan.htm.
 *
 * The Request Loan form has:
 *   - Loan Amount input
 *   - Down Payment input
 *   - From Account dropdown (source for down payment)
 *   - Apply Now button
 *
 * ParaBank evaluates the loan request and renders one of two outcomes:
 *   - Approved: "Congratulations, your loan has been approved." with a new
 *     account number link.
 *   - Denied: "We're sorry, but your loan request has been denied." message.
 *
 * Validation errors appear as span.error elements for empty fields.
 *
 * Locator rationale:
 *   - Loan amount and down payment inputs: targeted by element ID since these
 *     fields have no associated <label> with for attributes.
 *   - The from-account dropdown is composed via AccountSelector.
 *   - Result panel is identified by id="loanRequestResults" — a stable ID.
 *   - Approval/denial heading: getByRole('heading') with the exact text because
 *     both states render h1 headings inside the result panel.
 *   - New account link: locating by role 'link' within the result panel is
 *     reliable since that is the only link rendered in the success panel.
 *
 * @example
 * await requestLoanPage.navigate();
 * await requestLoanPage.applyForLoan('2000', '100', fromAccountId);
 * const approved = await requestLoanPage.isApproved();
 * const newAccountId = await requestLoanPage.getNewAccountId();
 */
export class RequestLoanPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.nav = new NavigationBar(page);

    // Form inputs — targeted by element ID
    this.loanAmountInput = page.locator('#amount');
    this.downPaymentInput = page.locator('#downPayment');

    // From Account dropdown — composed component
    this.fromAccount = new AccountSelector(page.locator('#fromAccountId'));

    // Submit button
    this.applyButton = page.locator('input[value="Apply Now"]');

    // Result panel — shown after form submission
    this.resultPanel = page.locator('#loanRequestResults');

    // Approval and denial states — headings inside the result panel
    this.approvalHeading = this.resultPanel.getByRole('heading', {
      name: 'Congratulations, your loan has been approved.',
    });
    this.denialHeading = this.resultPanel.getByRole('heading', {
      name: "We're sorry, but your loan request has been denied.",
    });

    // New account link — appears only on approval
    this.newAccountLink = this.resultPanel.getByRole('link');

    // Validation error spans
    this.loanAmountError = page.locator('#amount-error');
    this.downPaymentError = page.locator('#downPayment-error');
  }

  /** Navigate to the Request Loan page. */
  async navigate() {
    await this.page.goto(ROUTES.REQUEST_LOAN);
  }

  /**
   * Fill and submit the loan request form.
   * @param {string} loanAmount - The requested loan amount (e.g. "2000")
   * @param {string} downPayment - The down payment amount (e.g. "100")
   * @param {string|number} fromAccountId - Account ID to draw the down payment from
   */
  async applyForLoan(loanAmount, downPayment, fromAccountId) {
    await this.loanAmountInput.fill(loanAmount);
    await this.downPaymentInput.fill(downPayment);
    await this.fromAccount.selectById(fromAccountId);
    await this.applyButton.click();
    // Wait for the result panel to appear — it loads asynchronously via AJAX
    await this.resultPanel.waitFor({ state: 'visible' });
  }

  /**
   * Return true if the loan was approved, false if denied.
   * @returns {Promise<boolean>}
   */
  async isApproved() {
    return this.approvalHeading.isVisible();
  }

  /**
   * Return the new account ID created for an approved loan.
   * Reads the link text from the result panel.
   * @returns {Promise<string>}
   */
  async getNewAccountId() {
    const text = await this.newAccountLink.textContent();
    return text?.trim() ?? '';
  }

  /**
   * Submit the form with only a loan amount — used for validation tests
   * where the down payment field is left empty.
   * @param {string} loanAmount
   * @param {string|number} fromAccountId
   */
  async submitWithoutDownPayment(loanAmount, fromAccountId) {
    await this.loanAmountInput.fill(loanAmount);
    await this.fromAccount.selectById(fromAccountId);
    await this.applyButton.click();
  }

  /**
   * Submit the form leaving the loan amount empty — triggers validation error.
   * @param {string} downPayment
   * @param {string|number} fromAccountId
   */
  async submitWithoutLoanAmount(downPayment, fromAccountId) {
    await this.downPaymentInput.fill(downPayment);
    await this.fromAccount.selectById(fromAccountId);
    await this.applyButton.click();
  }
}

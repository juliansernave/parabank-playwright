import { ROUTES } from '../data/constants.js';
import { NavigationBar } from './components/NavigationBar.js';
import { AccountSelector } from './components/AccountSelector.js';

/**
 * FindTransactionsPage — page object for /parabank/findtrans.htm.
 *
 * Provides four search modes:
 *   1. By Transaction ID
 *   2. By Date
 *   3. By Date Range (from date + to date)
 *   4. By Amount
 *
 * Each mode has its own submit button. Results appear in a table below the form
 * once the search completes.
 *
 * Locator rationale:
 *   - Account dropdown: composed via AccountSelector using element id="accountId".
 *   - Search inputs: targeted by element ID (#transactionId, #transactionDate, etc.)
 *     — the form is plain HTML with stable IDs and no AngularJS directives.
 *   - Submit buttons: each has a unique element ID (#findById, #findByDate, etc.).
 *   - Results table: identified by id="transactionTable".
 *   - No results message: identified by id="errorContainer" (ParaBank shows this
 *     div when no transactions match the search criteria).
 *
 * @example
 * await findTransactionsPage.navigate();
 * await findTransactionsPage.selectAccount(accountId);
 * await findTransactionsPage.searchByAmount('100');
 * const rows = await findTransactionsPage.getResultRowCount();
 */
export class FindTransactionsPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.nav = new NavigationBar(page);

    // Account selector — required for all searches
    this.accountSelector = new AccountSelector(page.locator('#accountId'));

    // Submit buttons — each has a stable element ID assigned by ParaBank.
    // The form is plain HTML (no AngularJS ng-click); buttons are type="submit".
    this.findByIdButton = page.locator('#findById');
    this.findByDateButton = page.locator('#findByDate');
    this.findByDateRangeButton = page.locator('#findByDateRange');
    this.findByAmountButton = page.locator('#findByAmount');

    // Search inputs — each has a stable element ID.
    this.transactionIdInput = page.locator('#transactionId');
    this.searchDateInput = page.locator('#transactionDate');
    this.fromDateInput = page.locator('#fromDate');
    this.toDateInput = page.locator('#toDate');
    this.amountInput = page.locator('#amount');

    // Results
    this.resultsTable = page.locator('#transactionTable');
    this.resultRows = page.locator('#transactionTable tbody tr');
    // #errorContainer is present in the DOM but stays hidden for empty amount/date
    // searches — ParaBank renders the results table with 0 rows in that case.
    // It may appear for form-validation errors (e.g. invalid input).
    this.noResultsMessage = page.locator('#errorContainer');
  }

  /** Navigate to the Find Transactions page. */
  async navigate() {
    await this.page.goto(ROUTES.FIND_TRANSACTIONS);
    // Wait for the account dropdown to be populated before returning — AngularJS
    // loads the options via AJAX and they must exist before selectAccount() is called.
    await this.accountSelector.locator.locator('option:not([value=""])').first().waitFor({ state: 'attached' });
  }

  /**
   * Select the account to search within.
   * Must be called before any search method.
   * @param {string|number} accountId
   */
  async selectAccount(accountId) {
    await this.accountSelector.selectById(accountId);
  }

  /**
   * Wait for the search response to render — either a results table or the
   * "no results" error container becomes visible. Called after every search.
   */
  async #waitForSearchResponse() {
    await this.resultsTable.or(this.noResultsMessage).first().waitFor({ state: 'visible' });
  }

  /**
   * Search transactions by transaction ID.
   * @param {string|number} transactionId
   */
  async searchByTransactionId(transactionId) {
    await this.transactionIdInput.fill(String(transactionId));
    await this.findByIdButton.click();
    await this.#waitForSearchResponse();
  }

  /**
   * Search transactions by a single date.
   * @param {string} date - Format: MM-DD-YYYY (use date.helper.js helpers)
   */
  async searchByDate(date) {
    await this.searchDateInput.fill(date);
    await this.findByDateButton.click();
    await this.#waitForSearchResponse();
  }

  /**
   * Search transactions within a date range.
   * @param {string} fromDate - Format: MM-DD-YYYY
   * @param {string} toDate - Format: MM-DD-YYYY
   */
  async searchByDateRange(fromDate, toDate) {
    await this.fromDateInput.fill(fromDate);
    await this.toDateInput.fill(toDate);
    await this.findByDateRangeButton.click();
    await this.#waitForSearchResponse();
  }

  /**
   * Search transactions by exact amount.
   * @param {string|number} amount
   */
  async searchByAmount(amount) {
    await this.amountInput.fill(String(amount));
    await this.findByAmountButton.click();
    await this.#waitForSearchResponse();
  }

  /**
   * Return the number of result rows in the transactions table.
   * @returns {Promise<number>}
   */
  async getResultRowCount() {
    return this.resultRows.count();
  }

  /**
   * Return all transaction IDs from the result rows.
   * The transaction table columns are: Date | Transaction (linked) | Debit | Credit.
   * The second column holds an <a> whose href contains the transaction ID as the
   * `id` query parameter (e.g. `activity.htm?id=14254`). The link text is the
   * transaction description, not the numeric ID.
   * @returns {Promise<string[]>}
   */
  async getResultTransactionIds() {
    const links = this.resultRows.locator('td:nth-child(2) a');
    const count = await links.count();
    const ids = [];
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      const url = new URL(href ?? '', 'http://dummy');
      ids.push(url.searchParams.get('id') ?? '');
    }
    return ids;
  }

  /**
   * Return the text content of all result rows for general assertions.
   * @returns {Promise<string[]>}
   */
  async getResultRowTexts() {
    const count = await this.resultRows.count();
    const texts = [];
    for (let i = 0; i < count; i++) {
      const text = await this.resultRows.nth(i).textContent();
      texts.push(text?.trim() ?? '');
    }
    return texts;
  }
}

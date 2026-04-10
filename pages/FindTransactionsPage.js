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
 *   - Account dropdown: composed via AccountSelector using the element ID.
 *   - Search inputs: targeted by element ID (#criteria.transactionId, etc.)
 *     because ParaBank's form uses numeric IDs and no aria-label attributes.
 *   - Submit buttons: each search section has its own button with a specific
 *     value text (e.g., "Find by Amount") — targeted by input[value="X"].
 *   - Results table: identified by id="transactionTable".
 *   - No results message: ParaBank renders this as a paragraph inside the result
 *     area — targeted by text content.
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

    // Search input fields — identified by element IDs
    this.transactionIdInput = page.locator('#criteria\\.transactionId');
    this.searchDateInput = page.locator('#criteria\\.onDate');
    this.fromDateInput = page.locator('#criteria\\.fromDate');
    this.toDateInput = page.locator('#criteria\\.toDate');
    this.amountInput = page.locator('#criteria\\.amount');

    // Submit buttons — one per search mode
    this.findByIdButton = page.locator('button[ng-click="criteria.searchById()"]');
    this.findByDateButton = page.locator('button[ng-click="criteria.searchByDate()"]');
    this.findByDateRangeButton = page.locator('button[ng-click="criteria.searchByDateRange()"]');
    this.findByAmountButton = page.locator('button[ng-click="criteria.searchByAmount()"]');

    // Results
    this.resultsTable = page.locator('#transactionTable');
    this.resultRows = page.locator('#transactionTable tbody tr');
    this.noResultsMessage = page.locator('#noTransactions');
  }

  /** Navigate to the Find Transactions page. */
  async navigate() {
    await this.page.goto(ROUTES.FIND_TRANSACTIONS);
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
   * Search transactions by transaction ID.
   * @param {string|number} transactionId
   */
  async searchByTransactionId(transactionId) {
    await this.transactionIdInput.fill(String(transactionId));
    await this.findByIdButton.click();
  }

  /**
   * Search transactions by a single date.
   * @param {string} date - Format: MM-DD-YYYY (use date.helper.js helpers)
   */
  async searchByDate(date) {
    await this.searchDateInput.fill(date);
    await this.findByDateButton.click();
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
  }

  /**
   * Search transactions by exact amount.
   * @param {string|number} amount
   */
  async searchByAmount(amount) {
    await this.amountInput.fill(String(amount));
    await this.findByAmountButton.click();
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
   * Each result row links to the transaction detail page; the link text is the ID.
   * @returns {Promise<string[]>}
   */
  async getResultTransactionIds() {
    const links = this.resultRows.locator('td:first-child a');
    const count = await links.count();
    const ids = [];
    for (let i = 0; i < count; i++) {
      const text = await links.nth(i).textContent();
      ids.push(text?.trim() ?? '');
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

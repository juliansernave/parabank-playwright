import { ROUTES } from '../data/constants.js';
import { NavigationBar } from './components/NavigationBar.js';

/**
 * AccountOverviewPage — page object for /parabank/overview.htm.
 *
 * Displays the list of all accounts for the authenticated customer,
 * each with a balance, and a total balance row at the bottom.
 *
 * Locator rationale:
 *   - getByRole('heading') targets the visible "Accounts Overview" h1 semantically.
 *   - Account rows live in a table; we scope to tbody to avoid the header row.
 *     CSS locator is used because the table has no accessible role name and
 *     the row cells have no labels — structural selection is appropriate here.
 *   - The "Total" row is identified by its visible text "Total" which is stable.
 *   - Account number links are <a> tags inside the first cell of each data row.
 *
 * @example
 * await overviewPage.navigate();
 * const count = await overviewPage.getAccountRowCount();
 * const total = await overviewPage.getTotalBalance();
 */
export class AccountOverviewPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.nav = new NavigationBar(page);

    // Page heading — present once the authenticated overview loads
    this.heading = page.getByRole('heading', { name: 'Accounts Overview' });

    // The accounts table — only rows that contain an account link.
    // The total row lives in <tbody> on staging so a plain tbody tr selector
    // would include it; filtering by the presence of an <a> tag excludes it.
    this.accountRows = page.locator('table#accountTable tbody tr').filter({ has: page.locator('td a') });

    // The total balance row — ParaBank renders this in <tbody> (not <tfoot>),
    // identified by the "Total" text in the first cell.
    this.totalRow = page.locator('table#accountTable tr').filter({ hasText: /Total/ });

    // Displayed total balance amount cell — second <td> of the Total row
    this.totalBalance = this.totalRow.locator('td').nth(1);
  }

  /** Navigate to the accounts overview page. */
  async navigate() {
    await this.page.goto(ROUTES.OVERVIEW);
    // AngularJS renders the account table asynchronously — wait for at least one
    // row to be present before returning so callers don't read a stale empty table.
    await this.accountRows.first().waitFor({ state: 'visible' });
  }

  /**
   * Return the number of account data rows in the table.
   * @returns {Promise<number>}
   */
  async getAccountRowCount() {
    return this.accountRows.count();
  }

  /**
   * Return all account IDs found as link text in the table.
   * Each row's first cell contains an <a> linking to that account's activity.
   * @returns {Promise<string[]>}
   */
  async getAccountIds() {
    const links = this.accountRows.locator('td:first-child a');
    const count = await links.count();
    const ids = [];
    for (let i = 0; i < count; i++) {
      const text = await links.nth(i).textContent();
      ids.push(text?.trim() ?? '');
    }
    return ids;
  }

  /**
   * Click the account number link for the given account ID.
   * Navigates to the account activity page for that account.
   * @param {string|number} accountId
   */
  async clickAccountLink(accountId) {
    await this.accountRows
      .locator('td:first-child a')
      .filter({ hasText: String(accountId) })
      .click();
  }

  /**
   * Parse and return all individual account balance values from the table.
   * Handles ParaBank's "$1,234.56" currency format.
   * @returns {Promise<number[]>}
   */
  async getAllBalances() {
    // Column 3 is "Available Amount" — same column the total row sums.
    // Column 2 is "Balance" (includes pending), which differs from the displayed total.
    const balanceCells = this.accountRows.locator('td:nth-child(3)');
    const count = await balanceCells.count();
    const balances = [];
    for (let i = 0; i < count; i++) {
      const text = await balanceCells.nth(i).textContent();
      balances.push(parseCurrency(text ?? ''));
    }
    return balances;
  }

  /**
   * Parse and return the displayed total balance from the table footer.
   * @returns {Promise<number>}
   */
  async getDisplayedTotalBalance() {
    const text = await this.totalBalance.textContent();
    return parseCurrency(text ?? '');
  }
}

/**
 * Parse a ParaBank currency string like "$1,234.56" or "($50.00)" into a number.
 * Negative values in ParaBank are sometimes shown with parentheses.
 * @param {string} text
 * @returns {number}
 */
function parseCurrency(text) {
  const cleaned = text.trim().replace(/[$,]/g, '');
  // Parentheses indicate negative: ($50.00) → -50
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    return -parseFloat(cleaned.slice(1, -1));
  }
  return parseFloat(cleaned) || 0;
}

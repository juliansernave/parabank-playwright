import { ROUTES } from '../../data/constants.js';

/**
 * NavigationBar — component object for the ParaBank left-side navigation menu.
 *
 * The nav menu is present on all authenticated pages. Extracting it into a
 * component avoids duplicating the same locators across every page object
 * that needs navigation capability.
 *
 * Locator rationale:
 *   - The nav links do not have stable IDs, so getByRole('link', { name }) is
 *     used throughout. This matches the visible text the user sees and survives
 *     minor DOM restructuring.
 *   - Root is scoped to #leftPanel which contains only the nav — prevents
 *     false matches if the same text appears in content areas.
 *
 * @example
 * // Composed into a page object:
 * this.nav = new NavigationBar(page);
 * await this.nav.goToTransfer();
 */
export class NavigationBar {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    // Scope all child locators to the left panel navigation element.
    // ParaBank renders its navigation inside #leftPanel consistently across pages.
    this.root = page.locator('#leftPanel');

    this.overviewLink = this.root.getByRole('link', { name: 'Accounts Overview' });
    this.openAccountLink = this.root.getByRole('link', { name: 'Open New Account' });
    this.transferLink = this.root.getByRole('link', { name: 'Transfer Funds' });
    this.billPayLink = this.root.getByRole('link', { name: 'Bill Pay' });
    this.findTransactionsLink = this.root.getByRole('link', { name: 'Find Transactions' });
    this.updateProfileLink = this.root.getByRole('link', { name: 'Update Contact Info' });
    this.requestLoanLink = this.root.getByRole('link', { name: 'Request Loan' });
    this.logOutLink = this.root.getByRole('link', { name: 'Log Out' });
  }

  /** Navigate to the Accounts Overview page. */
  async goToOverview() {
    await this.overviewLink.click();
    await this.page.waitForURL(new RegExp(ROUTES.OVERVIEW));
  }

  /** Navigate to the Transfer Funds page. */
  async goToTransfer() {
    await this.transferLink.click();
    await this.page.waitForURL(new RegExp(ROUTES.TRANSFER));
  }

  /** Navigate to the Bill Pay page. */
  async goToBillPay() {
    await this.billPayLink.click();
    await this.page.waitForURL(new RegExp(ROUTES.BILL_PAY));
  }

  /** Navigate to the Find Transactions page. */
  async goToFindTransactions() {
    await this.findTransactionsLink.click();
    await this.page.waitForURL(new RegExp(ROUTES.FIND_TRANSACTIONS));
  }

  /** Navigate to the Request Loan page. */
  async goToRequestLoan() {
    await this.requestLoanLink.click();
    await this.page.waitForURL(new RegExp(ROUTES.REQUEST_LOAN));
  }

  /**
   * Log out and return to the login page.
   * Waits for navigation to settle after the logout request completes.
   */
  async logOut() {
    await this.logOutLink.click();
    await this.page.waitForURL(new RegExp(ROUTES.LOGIN));
  }
}

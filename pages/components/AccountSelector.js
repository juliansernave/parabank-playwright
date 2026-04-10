/**
 * AccountSelector — component object for the account <select> dropdowns.
 *
 * ParaBank renders the same account dropdown UI on Transfer Funds, Bill Pay,
 * and Find Transactions. This component centralises the selector so a change
 * to the underlying <select> only requires one edit.
 *
 * Locator rationale:
 *   - A <select> in ParaBank has no associated <label>, so getByRole('combobox')
 *     is not reliably differentiated when multiple dropdowns are on the page.
 *   - We accept the locator at construction time so the caller can use
 *     page.locator('#fromAccountId') or page.locator('#toAccountId') as needed.
 *     This keeps the component reusable without hardcoding a specific element ID.
 *
 * @example
 * // In a page object constructor:
 * this.fromAccount = new AccountSelector(page.locator('#fromAccountId'));
 * this.toAccount   = new AccountSelector(page.locator('#toAccountId'));
 *
 * // In a test (through page object methods):
 * await transferPage.selectFromAccount('12345');
 */
export class AccountSelector {
  /**
   * @param {import('@playwright/test').Locator} selectLocator - The <select> element locator
   */
  constructor(selectLocator) {
    this.select = selectLocator;
  }

  /**
   * Select an account by its account ID value.
   * Uses Playwright's selectOption which handles <select> natively.
   * @param {string|number} accountId
   */
  async selectById(accountId) {
    await this.select.selectOption({ value: String(accountId) });
  }

  /**
   * Return the currently selected account ID value.
   * @returns {Promise<string>}
   */
  async getSelectedValue() {
    return this.select.inputValue();
  }

  /**
   * Return all available account IDs from the dropdown options.
   * Used by tests that need to verify the dropdown is populated.
   * @returns {Promise<string[]>}
   */
  async getAllValues() {
    return this.select.evaluate((el) =>
      Array.from(el.options).map((opt) => opt.value).filter((v) => v !== '')
    );
  }

  /**
   * Expose the raw locator for web-first assertions in tests.
   * Tests can: await expect(transferPage.fromAccountSelector.select).toBeVisible()
   * @returns {import('@playwright/test').Locator}
   */
  get locator() {
    return this.select;
  }
}

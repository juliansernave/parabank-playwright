# Naming Conventions

## Files
- Page objects: `<page-name>.page.js` (e.g., `login.page.js`)
- Components: `<component-name>.component.js` (e.g., `navbar.component.js`)
- API clients: `<resource>.client.js` (e.g., `accounts.client.js`)
- Test specs: `<feature>.spec.js` (e.g., `login.spec.js`)
- Fixtures: `<context>.fixture.js` (e.g., `auth.fixture.js`)
- Helpers: `<purpose>.helper.js` (e.g., `date.helper.js`)
- Schemas: `<resource>.schema.js` (e.g., `user.schema.js`)

## Test Descriptions
- `describe`: Feature or page name → `describe('Login Page', ...)`
- `test/it`: Action + expected result → `test('should display error for invalid credentials', ...)`
- Avoid: `test('test login')`, `test('TC001')`, `test('it works')`

## Variables
- Page objects: `loginPage`, `dashboardPage`
- API clients: `accountsClient`, `authClient`
- Test data: `validUser`, `expiredUser`, `adminCredentials`
- Locators: descriptive, not implementation → `submitButton` not `btn1`

## Git
- Branches: `feature/add-login-tests`, `fix/flaky-checkout-test`
- Commits: conventional commits → `feat(login): add invalid credentials test`
- PRs: link to ticket if available → `[PROJ-123] Add payment flow tests`

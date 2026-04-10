# Framework Decision Matrix

## When to use POM (Page Object Model)
- Multiple tests interact with the same pages
- Team has 2+ people maintaining tests
- Application has stable, page-based navigation
- Tests need to survive UI refactors

## When POM is overkill
- Less than 10 tests total
- Single-page application with dynamic components
- Throwaway/spike automation
- API-only test suites

## When to use Page Component Model instead
- Heavy component reuse across pages (modals, tables, navbars)
- SPAs where "pages" are fluid
- Design system with consistent components

## When to use Functional/Action-based approach
- API-first testing
- Short-lived test suites
- Team prefers functional programming style
- Tests are mostly data-driven with minimal UI interaction

## When to add Factory pattern
- Multiple test data variations needed
- Tests require different user types/roles
- Complex object creation with many optional fields

## When to add Strategy pattern
- Tests run in multiple environments (dev, staging, prod)
- Different auth mechanisms per environment
- Feature flags change test behavior

## When to add Builder pattern
- Complex test data construction
- API request bodies with many fields
- Page objects with configurable initialization

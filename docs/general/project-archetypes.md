# Project Archetypes — Architecture Templates

## Small Project (< 30 tests, 1 maintainer)

```
project-root/
├── tests/
│   ├── ui/
│   └── api/
├── pages/
├── utils/
├── playwright.config.js
├── package.json
└── .github/workflows/test.yml
```

- Flat POM, no base class needed yet
- Single config file
- Simple CI: run all tests on push


## Medium Project (30–100 tests, 2–3 maintainers)

```
project-root/
├── tests/
│   ├── ui/
│   │   ├── smoke/
│   │   └── regression/
│   └── api/
│       ├── smoke/
│       └── regression/
├── pages/
│   ├── base.page.js
│   ├── login.page.js
│   └── ...
├── api/
│   ├── clients/
│   └── schemas/
├── fixtures/
│   ├── test-data/
│   └── custom-fixtures.js
├── utils/
│   ├── helpers.js
│   └── constants.js
├── config/
│   └── environments.js
├── playwright.config.js
├── package.json
└── .github/workflows/test.yml
```

- Fixture system for test data
- Sharded CI for regression


## Large Project (100+ tests, 4+ maintainers)

- Add: Page Component Model for shared UI components
- Add: API client layer with auth management
- Add: Test data factories
- Add: Custom reporter + Slack integration
- Add: Docker-compose for local dependencies
- Add: Linting + pre-commit hooks for test code
- Add: Test tagging system (@smoke, @regression, @feature-X)
- Consider: Monorepo structure if UI + API + Performance tests coexist


## Portfolio/Demo Project (recommended for showcasing skills)

- Target: Medium Project archetype
- Must have: README with architecture diagram, CI badges, setup instructions
- Must have: At least 1 example of each layer (UI test, API test, fixture, CI pipeline)
- Must have: Allure or HTML reporting with screenshots
- Nice to have: Cross-browser config, Docker support, AI test generation demo

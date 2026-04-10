# CI/CD Patterns for Test Automation

## GitHub Actions — Standard Setup
- Trigger: on push to main, on PR, on schedule (nightly)
- Matrix: browsers x environments
- Artifacts: Allure report, screenshots on failure, video on failure
- Retry: 2 retries for flaky tests (with --retries flag)
- Parallelization: shard by test file (Playwright --shard)
- Caching: node_modules, Playwright browsers

## Pipeline Stages (recommended order)
1. Install and cache dependencies
2. Lint test code (eslint/prettier)
3. Run smoke suite (< 2 min, blocks PR merge)
4. Run full regression (parallel/sharded, runs on merge to main)
5. Generate and publish report
6. Notify on failure (Slack/Teams webhook)

## Reporting Strategy
- Allure for detailed reporting (screenshots, steps, history)
- GitHub Actions summary for quick PR feedback
- Slack notification with pass/fail count and report link

## Flaky Test Management
- Tag flaky tests, don't delete them
- Quarantine suite: runs separately, doesn't block pipeline
- Track flakiness rate over time
- Fix or remove after 2 weeks in quarantine

## Environment Matrix

| Environment | Trigger          | Browsers       | Parallel |
|-------------|------------------|----------------|----------|
| PR check    | Pull request     | Chromium only  | No       |
| Staging     | Merge to main    | Chromium + FF  | Yes (3)  |
| Nightly     | Cron schedule    | All 3 browsers | Yes (5)  |

## Bitbucket Pipelines — Adaptation Notes
- Use pipes for caching (node, browsers)
- Parallel steps via "parallel" keyword in bitbucket-pipelines.yml
- Artifacts: download step for reports
- Limited matrix support compared to GitHub Actions — use parallel steps instead

## GitLab CI — Adaptation Notes
- Use stages for pipeline ordering
- Parallel keyword with matrix for browser/env combos
- Artifacts with expire_in for report retention
- Built-in retry keyword per job

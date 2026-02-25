# Test Selector Guidelines (E2E Stability)

This project uses Playwright E2E tests. To reduce CI failures during UI refactors, **core filters and navigation controls must expose stable `data-testid` values**.

## Why this exists

Text placeholders and visual labels change often during UX updates. E2E tests should target stable IDs, not copy or placeholder text.

## Rules

1. Use `data-testid` for all **core filters** (status, floor, room, category).
2. Keep `data-testid` values stable across refactors.
3. When replacing a control type (input -> chips -> dropdown), keep the same test ID contract when possible.
4. Prefer `getByTestId(...)` in Playwright over `getByPlaceholder(...)` for core flow steps.
5. If a test ID must change, update:
   - the relevant Playwright tests
   - `scripts/check-e2e-selectors.js`
   - this guideline document

## Current required selectors

### IT tickets
- File: `client/src/pages/it/Tickets.jsx`
- Required:
  - `it-filter-status-${status.value}`
  - `it-filter-floor`
  - `it-filter-room`

### User report
- File: `client/src/pages/user/Report.jsx`
- Required:
  - `user-report-filter-status-${opt.value}`
  - `filter-floor`
  - `filter-room`

### User history
- File: `client/src/components/user/TicketHistory.jsx`
- Required:
  - `user-history-filter-category-all`
  - `user-history-filter-category-${cat.id}`
  - `history-filter-floor`
  - `history-filter-room`
  - `ticket-table`

## CI guard

`npm run check:e2e:selectors`

This script verifies that required selectors still exist in source files and fails fast with explicit messages if they are removed.

## PR checklist (UI changes touching filters)

- [ ] Core filter controls keep stable `data-testid`
- [ ] Playwright tests use `getByTestId` for those controls
- [ ] `npm run check:e2e:selectors` passes
- [ ] Updated this file if selector contracts changed

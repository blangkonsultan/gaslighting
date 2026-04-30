# Current Tasks

## Active

## Blocked

## Completed
- [x] Remove transfer/new nav link (dead route — transfer handled in transactions/new)
- [x] Fix reports month navigation bug
  - **Files modified:**
    - `src/lib/dates.ts` — `addMonthsYmd` now preserves input format
    - `src/lib/dates.test.ts` — Updated test assertions
    - `src/services/transactions.service.ts` — Added `getEarliestTransactionDate`
    - `src/lib/query-client.ts` — Added `reports.earliest` query key
    - `src/pages/reports/ReportsPage.tsx` — Fixed timezone, 12-month trend, earliest query, prefetch, removed `hasRecords`
    - `src/components/reports/PeriodSelector.tsx` — Fixed timezone, removed dialog, added `minMonthKey`, simplified handlers
  - **Test results:** Tests pass (pre-existing billSchema failure unrelated). Build succeeds.
  - **Decisions:**
    - Use `todayYmd()` instead of `toISOString()` for local-time current month detection
    - Trend shows Jan–Dec of selected year (12 months)
    - Pre-fetch adjacent months for instant navigation
    - Remove confirmation dialog — navigate directly
    - Prev limited by earliest transaction date
  - **Next steps:** Manual verification of all 4 requirements

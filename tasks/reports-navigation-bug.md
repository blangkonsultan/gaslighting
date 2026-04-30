# Reports Page - Month Navigation Bug Fix

## Issues

1. **Clicking prev/next buttons does nothing**
   - User on April 2026, clicks prev to go to March 2026
   - Debug log shows: `{monthKey: '2026-04', prevMonth: '2026-04'}`
   - `addMonthsYmd("2026-04", -1)` returns "2026-04" unchanged
   - Root cause: `addMonthsYmd` function expected YYYY-MM-DD but received YYYY-MM, returned input unchanged when day was undefined

2. **Dialog incorrectly shows "no transaction"**
   - When clicking prev from April to March, dialog says March has no transactions
   - But transaction history clearly shows March has 1 transaction on 17th March
   - Root cause: `hasRecords` function closure bug - captures initial `monthKey` value, not the dynamic `targetMonth`

3. **"Invalid month key: 2026-03-01" error after confirmation**
   - After confirming dialog navigation
   - Error thrown from `monthRangeYmdFromMonthKey()` function
   - Root cause: That function expects "YYYY-MM" format but now receives "YYYY-MM-DD"

## Files to Fix

### `src/lib/dates.ts` - `addMonthsYmd` function
- **Already partially fixed**: Now handles YYYY-MM format (defaults day to 1)
- But returns YYYY-MM-DD format which breaks `monthRangeYmdFromMonthKey` validation

**Option 1**: Keep returning YYYY-MM-DD from `addMonthsYmd`, and fix `monthRangeYmdFromMonthKey` to accept both formats
**Option 2**: Change `addMonthsYmd` to return only YYYY-MM format (extract and return just YYYY-MM)

### `src/lib/reports/monthly.ts` - `monthRangeYmdFromMonthKey` function
- Needs to accept both "YYYY-MM" and "YYYY-MM-DD" formats
- Or needs to extract YYYY-MM and ignore the day portion

### `src/pages/reports/ReportsPage.tsx` - `hasRecords` function
- **Already partially fixed**: Removed special case for `targetMonth === monthKey`
- But the closure still captures the outer scope's `monthKey` which is stale
- Needs to pass `monthKey` as parameter instead of relying on closure

## Implementation Plan

### Step 1: Fix `monthRangeYmdFromMonthKey`
```typescript
export function monthRangeYmdFromMonthKey(monthKey: string): { start: string; end: string } {
  // Extract just YYYY-MM portion if day exists
  const cleanMonthKey = monthKey.slice(0, 7)
  
  if (!isValidMonthKey(cleanMonthKey)) {
    throw new Error(`Invalid month key: ${monthKey}`)
  }
  const [y, m] = cleanMonthKey.split("-")
  const year = Number(y)
  const month = Number(m)
  const endDay = daysInMonth(year, month)

  const start = `${y}-${m}-01`
  const end = `${y}-${m}-${String(endDay).padStart(2, "0")}`
  return { start, end }
}
```

### Step 2: Fix `hasRecords` closure issue in ReportsPage
```typescript
// Pass monthKey as parameter to avoid closure bug
const hasRecords = useCallback((targetMonth: string): boolean => {
  if (!trendData) return false
  const record = trendData.find((d) => d.monthKey === targetMonth)
  return (record?.income ?? 0) > 0 || (record?.expense ?? 0) > 0
}, [trendData])
```

### Step 3: Keep `addMonthsYmd` returning YYYY-MM-DD (or simplify to YYYY-MM)
Current implementation (after fix) handles YYYY-MM correctly and returns YYYY-MM-DD.
`monthRangeYmdFromMonthKey` fix in Step 1 will handle both formats.

## Verification

1. Test month navigation from April to March (prev)
2. Test month navigation from March to April (next)
3. Verify dialog appears only when target month has NO records
4. Verify clicking "yes" in dialog navigates to target month
5. Run tests for `dates.test.ts`

## Notes

- The `ReportsPage` currently stores `monthKey` as state, which changes on navigation
- The `trendQuery` fetches 6 months of data including the current month
- The `txQuery` fetches only the selected month's transactions

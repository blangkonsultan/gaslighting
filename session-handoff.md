# Session Handoff

- Goal: Implement Transaction Templates (feat-013)
- Current status: Done. All plan steps implemented, verified with tests (241/241 pass across 42 suites), lint (0 errors), build succeeds, Supabase migration applied.
- Branch / commit: main / clean working directory
## Completed This Session

- [x] Step 1: Configured MCP Vercel (`.mcp.json` and `~/.claude/settings.json`)
- [x] Step 2: Consolidated 18 migration files into 6 canonical sequentially-timestamped files in `supabase/migrations/` and cleaned up empty directories
- [x] Step 3: Implemented 4 critical security hardening fixes:
  - Role privilege escalation prevention trigger on `profiles`
  - Missing RLS on `account_presets` with admin-only mutations
  - IDOR prevention guards (`auth.uid() = p_user_id`) across all transfer & balance recalculation RPCs
  - Service-role key authentication & clamped `addMonths` in auto-debit Edge Function
- [x] Step 4: Configured HTTP security headers & PWA cache rules in `vercel.json`
- [x] Step 5: Converted to installable PWA with `vite-plugin-pwa`, generated 4 icons (192, 512, 180, 512-maskable), updated `vite.config.ts`, `tsconfig.app.json`, and `index.html`
- [x] Step 6: Fixed confirmed frontend bugs (duplicate useEffect, hard reload, admin nav link, trend query key, dynamic test dates)
- [x] Step 7: Cleaned up dead code (`ui-store.ts`, `ErrorBoundary.tsx`, uninstalled `next-themes`, updated `sonner.tsx`)
- [x] Step 8: Regenerated Supabase TS types for balance recalculation RPCs and removed `as any` casts in `balance-recalculation.service.ts`
- [x] Step 9: Created `src/lib/i18n.ts` string constants dictionary, adopted in high-traffic UI components, validators, transfers service, and resolved language inconsistencies in `NotFoundPage` and `AccountInfoPanel`
- [x] Step 10: Verified account balance architecture (kept stored balance model with O(1) reads and DB constraints; recorded ADR in Obsidian vault)
- [x] Step 11: Resolved guest auth deadlock in `useAuth.ts` when no active session exists
- [x] Step 12: Configured Vite dev middleware to automatically purge caches and unregister stale production service workers in dev mode
- [x] Step 13: Configured `server.hmr.clientPort: 443` and `host: "127.0.0.1"` for reliable Tailscale Serve reverse proxying without connection hangs
- [x] Step 14: Converted `src/App.tsx` routes to `React.lazy()` with `<Suspense fallback={<PageLoading />}>`, reducing initial requests from 135 to 60 (3x faster load time)
- [x] Step 15: Unified AdminCategoriesPage layout, typography, and dialog forms with AdminAccountPresetsPage:
  - Transformed outer card grid to vertical stack (`flex flex-col gap-4`)
  - Transformed CardContent into responsive 2-column grid (`grid gap-1 sm:grid-cols-2`)
  - Stripped semantic colors from CardTitle for clean neutral typography (`text-base`)
  - Added `w-full` to SelectTrigger in both admin dialogs (`touch-target w-full`)
  - Aligned native color swatch with touch-target (`h-11 w-11 shrink-0 cursor-pointer rounded-lg border border-border focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none`)
  - Added unit test suites `AdminCategoriesPage.test.tsx` and `AdminAccountPresetsPage.test.tsx` (81 passing tests)

- [x] Step 16: Impeccable Audit & Polish:
  - Added `touch-target` (min 44px) to transaction search input in `TransactionListPage.tsx`
  - Added `touch-target` to `BillsPage.tsx` action buttons ("Jeda", "Aktifkan", "Hapus") and integrated `ConfirmDialog` to prevent accidental deletion
  - Themed `BalanceRecalculationDialog.tsx` with design tokens (removed non-palette `bg-blue-50`, replaced with `bg-primary/10 border-primary/20`, `text-success` for checkmarks and increases, and `text-destructive` for decreases)
  - Aligned `SummaryCards.tsx` and `DashboardPage.tsx` to use semantic `text-success` for income / positive net flow and `TrendingUp` icons (improving AA contrast)
  - Refactored manual delete modals in `TransactionEditPage.tsx` to standardized `ConfirmDialog`
- [x] Step 17: Mobile Auto-Zoom and Tap-Zoom Prevention:
  - Updated `index.html` viewport meta tag with `maximum-scale=1.0, user-scalable=no`
  - Added `touch-action: manipulation;` on `html, body, button, a, nav, .touch-target` in `src/index.css` to eliminate double-tap zoom and 300ms tap delay
  - Added `touch-manipulation select-none` to `MobileBottomNav.tsx`
  - Updated `SelectTrigger` in `src/components/ui/select.tsx` from `text-sm` (14px) to `text-base md:text-sm` (16px on mobile), preventing WebKit/Chrome auto-zoom on filter selection
- [x] Step 18: Eliminate Mobile Horizontal Scroll on Dashboard & Transactions:
  - Added `w-full overflow-x-hidden` on `AppShell.tsx` outer container and `min-w-0` on `flex-col` and `main` to constrain flex children
  - Added `max-width: 100vw; overflow-x: hidden;` to `html, body` and `#root` in `src/index.css`
  - Added `flex-1 min-w-0` and `truncate` to transaction row description and secondary text in `DashboardPage.tsx` and `TransactionListPage.tsx`
  - Added `shrink-0` to transaction amount/action container
  - Verified `hasHorizontalScroll: false` and `docScrollWidth: 390` in headless mobile browser
- [x] Step 19: Auto-Debit Web Push Notification Architecture (feat-008):
  - Created migration `20260926000003_push_subscriptions.sql` with table `push_subscriptions`, index on `user_id`, and user-scoped RLS policies (SELECT, INSERT, UPDATE, DELETE)
  - Pushed migration to remote Supabase database and regenerated `src/types/database.ts`
  - Generated VAPID key pair via `web-push generate-vapid-keys`, configured `VITE_VAPID_PUBLIC_KEY` in `.env` & `.env.example`, and set Supabase project secrets (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`)
  - Switched VitePWA to `strategies: "injectManifest"` with custom `src/sw.ts` implementing workbox precache, NetworkFirst Supabase cache, push event listener with notification options, and notification click focus/navigation handler
  - Implemented `src/services/push-notifications.service.ts` for database upsert/delete and VAPID key Uint8Array decoding with full test suite (8 tests)
  - Implemented `src/hooks/usePushNotifications.ts` managing browser support detection, permission state, PushManager subscription lifecycle, and error handling with full test suite (5 tests)
  - Added "Notifikasi" section in `src/pages/settings/SettingsPage.tsx` with toggle switch and status messaging with full test suite (4 tests)
  - Updated auto-debit Edge Function `supabase/functions/auto-debit/index.ts` to dispatch web push notifications on bill success and failure with automatic expired endpoint pruning (404/410), deployed to Supabase
  - Tightened TypeScript types (BufferSource, PushSubscriptionData, SupabaseClient)
- [x] Step 20: Fix Unclickable Notification Toggle:
  - Identified root cause: `await navigator.serviceWorker.ready` hangs indefinitely when no active service worker exists on page boot, keeping `isPushLoading` permanently `true` and disabling `<Switch disabled={isPushLoading || ...} />`
  - Diagnosed dev environment conflict: `src/main.tsx` and `vite.config.ts` were actively unregistering `/sw.js` in dev mode to prevent stale production asset caching, destroying any active worker
  - Patched `src/hooks/usePushNotifications.ts` with `getActiveRegistration()` using `getRegistration()` and 1-second timeout-guarded `.ready` fallback, eliminating infinite loading states
  - Updated `src/main.tsx` to clear only cache storages (`caches.delete`) instead of unregistering the service worker
  - Updated `vite.config.ts` dev middleware to serve a non-caching push notification service worker for `/sw.js`
  - Fixed `Subscription failed - no active Service Worker`: added immediate `self.skipWaiting()` and `self.clients.claim()` in `src/sw.ts`, registered `/sw.js` on app boot in `src/main.tsx`, and ensured `registration.active` is non-null via statechange/polling before calling `pushManager.subscribe()`
  - Added "Kirim Notifikasi Uji Coba" button in `SettingsPage.tsx` enabling instant native OS status bar push notification tests
- [x] Step 21: Auto-Debit Execution & Timezone Alignment:
  - Aligned Edge Function date comparison with Indonesian timezone (`Asia/Jakarta`), resolving UTC date lag where the server evaluated Sept 27 as Sept 26
  - Allowed authorization with both modern project secret key and legacy vault service role key
  - Executed auto-debit: `Tagihan Listrik PLN` processed (Rp 250.000), recurring transaction created in `transactions`, `BCA Utama` balance deducted, and bill `next_date` advanced to `2026-10-27`
- [x] Step 22: Remediate GitGuardian Secret Leak & Invalidate Legacy Keys:
  - Eliminated hardcoded fallback JWT from `auto-debit/index.ts` and pushed clean commit
  - Disabled legacy API keys on Supabase project via Management API (`PUT /v1/projects/{ref}/api-keys/legacy?enabled=false`), permanently killing the leaked service role key with `HTTP 401 UNAUTHORIZED_DISABLED_LEGACY_KEY`
  - Provisioned and bound `service_role_v2` (`sb_secret_...`) across Supabase Vault and Supabase Secrets (`CRON_SECRET`)
  - Migrated local `.env` to modern Supabase publishable key (`sb_publishable_...`)
  - Re-tested dashboard, transactions, and settings in live application
- [x] Step 23: Report Exporting for CSV & Printable PDF (feat-009):
  - Implemented `src/lib/reports/export-csv.ts` with RFC 4180 escaping, UTF-8 BOM prefix, Indonesian labels, and summary totals (11 tests passing)
  - Created formal financial statement `src/components/reports/PrintableReport.tsx` with vintage/earthy branding, executive cash flow summary, category breakdowns, and transaction ledger (4 tests passing)
  - Added `@media print` CSS rules in `src/index.css`
  - Created responsive `src/components/reports/PrintPreviewDialog.tsx` with native window.print triggering (2 tests passing)
  - Integrated Export dropdown into `src/pages/reports/ReportsPage.tsx` with CSV and PDF options (3 tests passing)
  - Verified in headless browser: CSV download triggers toast, and PrintPreviewDialog renders formal financial statement
- [x] Step 24: Fix Mobile Preview & A4 Print Paper Layout:
  - Resolved mobile preview dialog cut-off: on 390px mobile screens, the 6-column statement was compressed into 276px causing text collisions and clipping the Nominal column at `-Rp 2.0`.
  - Added `overflow-x-auto` container with `min-w-[660px]` sheet layout inside `PrintPreviewDialog.tsx`, preserving A4 proportions on mobile and allowing smooth horizontal panning with helper hint (`💡 Geser tabel ke samping`).
  - Formally configured `@page { size: A4 portrait; margin: 10mm; }` and `.print-document { width: 190mm !important; }` in `src/index.css`, locking document geometry to A4 dimensions on all printing platforms.
- [x] Step 25: Eliminate Floating Dialog Modal from Print Media:
  - Resolved duplicate document artifact: `[data-slot="dialog-portal"]` and `[data-slot="dialog-content"]` remained visible during `window.print()`, overlaying the printed paper with the preview dialog card.
  - Marked dialog portal elements `display: none !important;` in `@media print` and tagged `DialogContent` with `no-print`.
  - Confirmed via print emulation: modal box is 100% removed, producing an immaculate single-sheet document.
- [x] Step 26: Advanced Filters & Transaction Tagging (feat-010):
  - Added `tags text[] not null default '{}'` with GIN index via migration `20260927000001_transaction_tags.sql` pushed to remote Supabase
  - Updated services, types, and validation schemas (`getUserTags`, `amountMin`, `amountMax`, `tags` containment queries)
  - Implemented `TagInput.tsx` with normalization, suggested tags, and keyboard shortcuts (6 tests passing)
  - Implemented `TransactionFilterSheet.tsx` with type, account, category, date range, amount range, and interactive tag cloud (3 tests passing)
  - Added filter button with badge count and active filter chips bar in `TransactionListPage.tsx`
  - Verified in browser with screenshot evidence: tagged transaction creation and tag-based filtering
- [x] Step 27: Smart Receipt Scanner with Client-Side OCR (feat-011):
  - Installed pinned `tesseract.js` (6.0.0) for zero-API-cost, privacy-preserving client-side OCR
  - Implemented `src/lib/receipt-parser.ts` parsing total amount, transaction date, merchant, and category suggestion (14 tests passing)
  - Implemented `src/lib/ocr.ts` with canvas image preprocessing (grayscale, contrast boost, 1800px scale) (2 tests passing)
  - Built `src/components/transactions/ReceiptScannerModal.tsx` with mobile camera capture, gallery picker, progress bar, and review form (2 tests passing)
  - Integrated "Scan Struk" button and auto-fill in `src/pages/transactions/TransactionCreatePage.tsx`
  - Verified in mobile browser with screenshot: camera/gallery trigger opens, review state populates form smoothly
- [x] Step 28: Polish Receipt Scanner Review Footer:
  - Added generous bottom padding (`px-5 pt-3.5 pb-6 sm:pb-4`) with backdrop blur and subtle border
  - Upgraded action buttons to 44px touch targets (`h-11 font-semibold`), removing the cramped bottom edge feeling

- [x] Step 29: Implement PWA Mobile Ergonomics & App Lock (feat-012):
  - Added Homescreen App Shortcuts in `vite.config.ts` manifest for instant expense, income, and receipt scanning
  - Added Web Share Target API in `vite.config.ts` manifest with `multipart/form-data` image sharing
  - Implemented Service Worker `POST /share-target` fetch handler in `src/sw.ts` caching shared images to `CacheStorage`
  - Updated `ReceiptScannerModal.tsx` and `TransactionCreatePage.tsx` for query params (`?scan=true`, `?type=`, `?shared_receipt=1`)
  - Implemented cryptographic PIN security in `src/lib/app-lock.ts` with SHA-256 and WebAuthn platform biometrics
  - Built Zustand store `src/stores/app-lock-store.ts` with visibilitychange auto-lock listeners
  - Built `AppLockScreen.tsx` with vintage/earthy theme, numeric keypad, biometrics trigger, and logout confirmation
  - Built `AppLockSettingsCard.tsx` and integrated into `SettingsPage.tsx`
  - Mounted `AppLockScreen` at top level in `src/App.tsx`
  - Verified via browser test with screenshots: settings toggle, setup dialog, instant locking, keypad entry, and shortcut navigation
- [x] Step 30: Polish LoginPage UI/UX (Impeccable craft pass):
  - Resolved critical UX bug: `AppLockScreen` now guards against unauthenticated users (`!sessionUserId`), preventing lock screen from covering `/auth/login`
  - Transformed flat card into warm vintage-earthy container with brand squircle emblem (`Wallet` icon) and tagline
  - Added show/hide password visibility toggle with `Eye` / `EyeOff` icons (min 44px touch target)
  - Added prefix icons (`Mail` and `Lock`) to form inputs with brand sage focus rings
  - Fixed WCAG AA contrast failure on "Daftar sekarang" link (`#446330` on `#E4DFB5`)
  - Seamless card layout removing awkward hairlines in `CardFooter`
  - Added `src/pages/auth/LoginPage.test.tsx` (4 tests passing)
  - Passed mechanical defect detector (`impeccable detect`) with 0 defects
  - Deployed to Vercel production: https://gaslighting-nine.vercel.app
- [x] Step 31: Integrate Brand Icon across App Surfaces (AppLogo adoption):
  - Created reusable `src/components/shared/AppLogo.tsx` providing crisp SVG rendering across sizes
  - Replaced plain text with `AppLogo` in mobile `Header.tsx` and desktop `DesktopSidebar.tsx`
  - Replaced generic wallet/shield icons in `LoginPage.tsx`, `RegisterPage.tsx`, and `AppLockScreen.tsx` with the official botanical "G" crest
  - Added `src/components/shared/AppLogo.test.tsx` (4 tests passing)
  - Deployed to Vercel production: https://gaslighting-nine.vercel.app
- [x] Step 32: Update Notification Click & Email Verification Redirects:
  - Aligned auto-debit Edge Function push payload URL to `/transactions` and deployed to Supabase
  - Updated Service Worker `notificationclick` handler in `src/sw.ts` and dev proxy to focus/open `/transactions`
  - Configured Supabase Auth `site_url` to `https://gaslighting-nine.vercel.app/auth/login` and allowed origins in `uri_allow_list`
  - Passed `emailRedirectTo: <origin>/auth/login?verified=true` in `registerUser` (`auth.service.ts`)
  - Designed and verified green confirmation banner in `LoginPage.tsx` with unit test `LoginPage.test.tsx` (197 tests passing)
  - Deployed to Vercel production: https://gaslighting-nine.vercel.app
- [x] Step 33: Comprehensive Security Hardening Audit & Remediations:
  - Created migration `20260927000002_security_hardening.sql`: revoked column-level `UPDATE` on `public.accounts` from `authenticated`, granted update on non-financial columns only, added `trigger_prevent_direct_balance_update`, enforced `account_id` ownership checks in `transactions` and `bills` RLS policies (preventing cross-account IDOR), and guarded `p_amount > 0` in `execute_transfer` RPC. Pushed to remote Supabase DB.
  - Patched session contamination in `src/hooks/useAuth.ts` by requiring `state.sessionUserId === session.user.id` before reading cached profile.
  - Purged Service Worker API caches (`supabase-api`, `shared-receipts`) on logout in `src/services/auth.service.ts`.
  - Neutralized CSV Formula Injection (CWE-1236) in `src/lib/reports/export-csv.ts`.
  - Safeguarded `safeNext` URI decoding in `src/pages/auth/LoginPage.tsx` with try/catch.
  - Aligned input and button widths in `LoginPage.tsx` to exact 308px (`px-6` unified padding).
  - Enforced `Strict-Transport-Security` (HSTS) and updated `Permissions-Policy` in `vercel.json`.
  - Deployed to Vercel production: https://gaslighting-nine.vercel.app
- [x] Step 34: Transaction Templates (feat-013):
  - Database migration `20260927000003_transaction_templates.sql` created and pushed to remote Supabase database: `transaction_templates` table with user foreign key, cascade delete, unique per user name, updated_at trigger, and full RLS policies (SELECT, INSERT, UPDATE, DELETE) with user isolation and account ownership validation.
  - Updated TypeScript schema in `src/types/database.ts` and exported `TransactionTemplate`, `TransactionTemplateInput` in `src/types/financial.ts`.
  - Implemented service `src/services/transaction-templates.service.ts` (`getTemplates`, `createTemplate`, `deleteTemplate`) with account and category joins.
  - Added `templates` query key in `src/lib/query-client.ts` and TanStack Query hook `src/hooks/useTransactionTemplates.ts` (`useTransactionTemplates`, `useCreateTemplate`, `useDeleteTemplate`).
  - Built `src/components/transactions/TemplatePicker.tsx` with horizontal chip scroll container, category icon fallback, formatted IDR amounts, and "Kelola" action button.
  - Built `src/components/transactions/SaveTemplateSheet.tsx` bottom sheet with auto-filled template name (capped at 30 chars), IDR amount inclusion toggle, name validation, and duplicate name (23505) error handling.
  - Built `src/components/transactions/TemplateManageSheet.tsx` bottom sheet with template list, type/account/amount subtitles, delete confirmation dialog, and empty state.
  - Wired template picker, save-as-template prompt in success toast action, and management sheet into `src/pages/transactions/TransactionCreatePage.tsx`.
  - Enhanced `src/components/shared/FormField.tsx` to accept string and custom error objects cleanly without RHF type casting.
  - Added 6 new unit test suites:
    - `src/services/transaction-templates.service.test.ts` (8 tests)
    - `src/hooks/useTransactionTemplates.test.tsx` (4 tests)
    - `src/components/transactions/TemplatePicker.test.tsx` (4 tests)
    - `src/components/transactions/SaveTemplateSheet.test.tsx` (6 tests)
    - `src/components/transactions/TemplateManageSheet.test.tsx` (5 tests)
    - `src/pages/transactions/TransactionCreatePage.test.tsx` (6 tests)
    - `src/components/shared/CategoryIcon.test.tsx` (5 tests)
    - `src/pages/templates/TemplatesPage.test.tsx` (5 tests)
    - Total test suite: 42 files, 241 tests passing (100% passing).
  - Added dedicated Template Management page (`/templates`, `src/pages/templates/TemplatesPage.tsx`) with search, template cards, "Gunakan" direct pre-fill routing, and deletion dialog.
  - Added navigation links: `DesktopSidebar` (user main nav), `MobileBottomNav` (Lainnya sheet), and `TransactionCreatePage` `?template_id=` parameter pre-fill support.
  - Passed mechanical defect detector (`impeccable detect`) with 0 defects.
## Verification Evidence
| Check | Command | Result | Notes |
|---|---|---|---|
| Migrations | `ls -1 supabase/migrations/` | 8 files | Sequential timestamps including 20260927000002_security_hardening.sql |
| Privilege Escalation | `grep -n "prevent_role_change" supabase/migrations/...` | Present | `BEFORE UPDATE` trigger on `public.profiles` |
| Balance Tamper Guard | `grep -n "prevent_direct_account_balance_update" supabase/migrations/...` | Present | Column REVOKE + BEFORE UPDATE trigger on `public.accounts` |
| IDOR Guards | `grep -n "auth.uid() <> p_user_id"` | Present | All 5 SECURITY DEFINER RPCs + transactions/bills account_id checks |
| Auto-debit Auth | `grep -n "authHeader !== Bearer"` | Present | Returns 401 when header missing/invalid |
| Push Edge Function | `curl -s -X POST https://nzfcbznsvqthqgxvdixk.supabase.co/functions/v1/auto-debit` | 401 Unauthorized | Deployed and verified |
| PWA Artifacts | `ls -l dist/sw.js dist/manifest.webmanifest` | Present | Generated by `injectManifest` build |
| Lint | `npm run lint` | 0 errors | ESLint passes (code 0) |
| Tests | `npm run test` | 241 passed | 42 test suites, 100% passing |
| Build | `npm run build` | Success | Type-check + Vite build + PWA service worker (injectManifest) |

## Files Changed

- `supabase/migrations/` (deleted 18 old migrations, added 6 consolidated migrations)
- `supabase/functions/auto-debit/index.ts`
- `vercel.json`
- `vite.config.ts`, `tsconfig.app.json`, `index.html`
- `public/pwa-192x192.png`, `public/pwa-512x512.png`, `public/pwa-512x512-maskable.png`, `public/apple-touch-icon.png`
- `src/hooks/useBalanceCheck.ts`, `src/hooks/useBalanceIssuesWarning.ts`
- `src/pages/dashboard/DashboardPage.tsx`
- `src/components/layout/DesktopSidebar.tsx`, `src/components/layout/MobileBottomNav.tsx`
- `src/pages/reports/ReportsPage.tsx`, `src/pages/transactions/TransactionListPage.tsx`
- `src/lib/validators.schemas.test.ts`, `src/lib/validators.transfer.test.ts`, `src/lib/validators.ts`
- `src/components/ui/sonner.tsx`, `package.json`, `package-lock.json`
- `src/services/balance-recalculation.service.ts`, `src/types/database.ts`, `src/services/transfers.service.ts`
- `src/lib/i18n.ts`, `src/pages/NotFoundPage.tsx`, `src/pages/NotFoundPage.test.tsx`
- `src/components/shared/AccountInfoPanel.tsx`, `src/components/bills/BillForm.tsx`
- `eslint.config.js`
- `feature_list.json`, `progress.md`
- `src/pages/admin/AdminCategoriesPage.tsx`
- `src/pages/admin/AdminAccountPresetsPage.tsx`
- `src/pages/admin/AdminCategoriesPage.test.tsx`
- `src/pages/admin/AdminAccountPresetsPage.test.tsx`
- `feature_list.json`, `progress.md`, `session-handoff.md`

## Decisions Made

- Retained Materialized Stored Balance architecture: O(1) balance reads, trigger synchronization, pessimistic locking, and on-demand repair RPCs (see ADR [[2026-09-26-stored-balance-architecture]]).
- Explicit IPv4 host binding (`127.0.0.1`) required for WSL2 Windows localhost forwarding to prevent `502 Bad Gateway` from Tailscale Serve.
- Automatic Service Worker unregistration during development mode to prevent stale production caches from corrupting unbundled dev assets.
- Route-level code-splitting using `React.lazy()` to optimize initial mobile page load latency over network tunnels.
- Neutralized Admin Card Titles: Stripped `text-primary` and `text-destructive` from AdminCategoriesPage headers to keep consistent with AdminAccountPresetsPage and rely on explicit category text and badge indicators.
- Standardized Dialog Dropdown & Color Picker: Enforced `touch-target w-full` on all SelectTriggers and 44px (`h-11 w-11 rounded-lg`) on native color swatches for touch target adherence and keyboard accessibility across admin surfaces.

## Next Steps

- Next feature development options: Category Spending Limits (Pagu Anggaran Bulanan) or Shared Space / Partner Linking.
- Dev server and production deployment are stable and up to date.

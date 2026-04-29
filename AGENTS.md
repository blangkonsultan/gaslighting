# Gaslighting - Project Guide

## Project Overview

Multi-user financial management app (budgeting for couples/shared finance). Mobile-first design with earthy/vintage theme.

## Tech Stack

- **Frontend:** React 19 + Vite 8 + TypeScript 6
- **Styling:** Tailwind CSS v4 (CSS-based config, no JS config file) + Shadcn UI v4 (base-ui, not Radix)
- **State:** TanStack Query v5 (server) + Zustand (client)
- **Forms:** React Hook Form + Zod v4
- **Charts:** Recharts
- **Routing:** react-router-dom v7
- **Backend:** Supabase (PostgreSQL, Auth, RLS, Edge Functions)
- **Icons:** Lucide React
- **Toasts:** Sonner

## Architecture

- `src/services/` — Supabase API calls (one file per domain)
- `src/hooks/` — TanStack Query hooks wrapping services
- `src/stores/` — Zustand stores for client-only state
- `src/pages/` — Route-level components
- `src/components/layout/` — AppShell, MobileBottomNav, DesktopSidebar, Header
- `src/components/ui/` — Shadcn UI components (auto-generated, do not edit manually)
- `src/components/shared/` — Reusable app components (AmountDisplay, ConfirmDialog, EmptyState, ErrorBoundary, LoadingSpinner, etc.)
- `src/components/forms/` — Form components (one per entity)
- `src/components/{auth,bills,charts,dashboard,reports,transactions}/` — Domain-specific components
- `src/lib/` — Utilities (utils, constants, validators, formatters, query-client, dates, money)
- `src/lib/reports/` — Report generation helpers
- `src/types/` — TypeScript type definitions (database.ts, financial.ts)
- `src/stores/` — Zustand stores (auth-store, transaction-filters, ui-store)
- `src/test/` — Test setup (setup.ts with jest-dom matchers)
- `src/assets/` — Static assets

## Key Conventions

- **Mobile-first responsive:** base = mobile, `md:` = tablet (768px), `lg:` = desktop (1024px)
- **Touch targets:** All interactive elements must have `touch-target` class (min 44px)
- **Currency:** Always use `formatCurrency()` from `@/lib/formatters` (IDR via `Intl.NumberFormat`)
- **Path alias:** `@/` maps to `src/`
- **Supabase client:** Always use typed client from `@/services/supabase.ts`
- **Shadcn UI v4:** Uses `@base-ui/react` (NOT Radix). No `asChild` prop on components.
- **Color palette:** Primary `#9AB17A` (Sage), Secondary `#C3CC9B` (Olive), Background `#FBE8CE` (Warm Cream), Card `#E4DFB5` (Beige)
- **Language:** Indonesian (id-ID) for user-facing text, English for code and commits
- **No dark mode:** Light-only theme

## Pages

`src/pages/` — Route-level components: admin, auth, bills, dashboard, onboarding, reports, settings, transactions, transfers, NotFoundPage.

## Environment

Copy `.env.example` to `.env`. Required: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

## Database

- 5 tables: `profiles`, `categories`, `accounts`, `transactions`, `bills`
- All tables have RLS policies scoped to `auth.uid() = user_id`
- `execute_transfer()` RPC for atomic inter-account transfers
- Balance auto-updates via triggers on `transactions` (insert/de reversal on delete)
- `profiles.onboarding_completed` gates dashboard access
- Admin role set manually in DB; new signups default to `user`
- Migrations stored in `supabase/migrations/`

## Common Commands

```bash
npm run dev          # Start dev server
npm run build        # Type-check + production build
npm run lint         # ESLint
npm run test         # Run all tests
npx shadcn@latest add <component>  # Add Shadcn UI component
```

## Testing

Every new component and page **must** have a corresponding test file. No exceptions.

### Stack

- **Unit tests:** Vitest + @testing-library/react + @testing-library/jest-dom
- **E2E (future):** Playwright

### File Locations & Naming

Tests are co-located with source files:
- `src/components/<domain>/<Component>.test.tsx`
- `src/pages/<domain>/<Page>.test.tsx`
- `src/hooks/<hook>.test.ts` / `src/hooks/<hook>.test.tsx`
- `src/services/<service>.test.ts`
- `src/lib/<module>.test.ts`

### Test Utilities

- `src/test/setup.ts` — Global setup (jest-dom matchers, cleanup)

### Rules

- **Components:** Test rendered output, user interactions, conditional rendering. Mock Supabase hooks/services.
- **Pages:** Test route rendering, data loading states (loading, error, empty, populated). Mock hooks at the module level.
- **Forms:** Test validation errors (Zod schemas), successful submission, field interactions.
- **Hooks:** Test query/mutation behavior using `renderHook`. Test loading/error/success states.
- **Services:** Test API call shapes and parameters using mocked Supabase client.
- **Lib/Utils:** Pure function tests — input/output, edge cases, error handling.

### Commands

```bash
npm run test                           # Run all tests (single pass)
npx vitest --watch                     # Watch mode
npx vitest run src/components/shared/  # Run tests for specific directory
```

## Task Handoff

Read `tasks/current.md` at session start. To resume: read `git log --oneline -10` + `git diff`, then continue from the handoff's next steps. Clear completed tasks — they're already in git history.

**During work:** Update `tasks/current.md` after each sub-task so mid-task handoff works. Commit once per completed task.

**Before ending or when context is running low,** update `tasks/current.md` with:
- Status (in-progress / blocked / done)
- Files modified (what changed in each)
- Test results (passing/failing, any errors)
- Decisions made and why
- Next steps — specific enough for a fresh agent to continue

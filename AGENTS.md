# Gaslighting - Project Guide

## Project Overview

Multi-user financial management app (budgeting for couples/shared finance). Mobile-first design with earthy/vintage theme.

## Tech Stack

- **Frontend:** React 19 + Vite 8 + TypeScript 6
- **Styling:** Tailwind CSS v4 (CSS-based config, no JS config file) + Shadcn UI v4 (base-ui, not Radix)
- **State:** TanStack Query v5 (server) + Zustand (client)
- **Forms:** React Hook Form + Zod v4
- **Charts:** Recharts
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
- `src/components/shared/` — Reusable app components
- `src/components/forms/` — Form components (one per entity)
- `src/lib/` — Utilities (utils, constants, validators, formatters, query-client)
- `src/types/` — TypeScript type definitions
- `src/test/` — Test utilities (setup, render wrapper, mocks, fixtures)

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
npx shadcn@latest add <component>  # Add Shadcn UI component
```

## Testing

Every new component and page **must** have a corresponding test file. No exceptions.

### Stack

- **Unit tests:** Vitest + @testing-library/react + @testing-library/jest-dom
- **API mocks:** MSW (Mock Service Worker) for Supabase API calls
- **E2E (future):** Playwright

### File Locations & Naming

- Component tests: `src/components/<domain>/<Component>.test.tsx` (co-located with component)
- Page tests: `src/pages/<domain>/<Page>.test.tsx` (co-located with page)
- Hook tests: `src/hooks/<hook>.test.ts` (co-located with hook)
- Service tests: `src/services/<service>.test.ts` (co-located with service)
- Lib tests: `src/lib/<module>.test.ts` (already exists for formatters, validators, reports)

### Test Utilities

- `src/test/setup.ts` — Global setup (testing-library matchers, MSW server)
- `src/test/render.tsx` — Custom `render()` wrapper with providers (QueryClient, Router, etc.)
- `src/test/mocks/` — Supabase client mocks, fixture data, factory helpers

### Rules

- **Components:** Test rendered output, user interactions, and conditional rendering. Mock Supabase hooks/services.
- **Pages:** Test route rendering, data loading states (loading, error, empty, populated). Mock hooks at the module level.
- **Forms:** Test validation errors (Zod schemas), successful submission, and field interactions.
- **Hooks:** Test query/mutation behavior using `renderHook` + MSW. Test loading/error/success states.
- **Services:** Test API call shapes and parameters using mocked Supabase client.
- **Lib/Utils:** Pure function tests — input/output, edge cases, error handling.

### Commands

```bash
npx vitest           # Run all tests
npx vitest --watch   # Watch mode
npx vitest run src/components/shared/  # Run tests for specific directory
npx vitest run --coverage  # Coverage report (when configured)
```

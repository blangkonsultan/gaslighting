# Gaslighting - Project Guide for Claude Code

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

## Testing (when implemented)

```bash
npx vitest           # Run tests
npx vitest --watch   # Watch mode
```

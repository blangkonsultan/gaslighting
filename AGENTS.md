# AGENTS.md

## Repository: Gaslighting

Multi-user financial management application with mobile-first responsive design.

## Build & Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc + vite build
npm run lint       # eslint
```

## Tech Stack

- React 19 + TypeScript 6 + Vite 8
- Tailwind CSS v4 + Shadcn UI v4
- Supabase (PostgreSQL + Auth + RLS + Edge Functions)
- TanStack Query v5 + Zustand
- Recharts, React Hook Form + Zod

## Project Structure

```
src/
  services/       # Supabase API calls
  hooks/          # TanStack Query hooks
  stores/         # Zustand client state
  pages/          # Route components
  components/
    layout/       # AppShell, MobileBottomNav, DesktopSidebar, Header
    ui/           # Shadcn UI (auto-generated)
    shared/       # Reusable components
    forms/        # Entity forms
    charts/       # Chart components
  lib/            # Utilities, validators, formatters
  types/          # TypeScript types
supabase/
  migrations/     # SQL migration files
  functions/      # Edge Functions (Deno)
```

## Key Patterns

- **Mobile-first:** base (mobile) → `md:` (768px) → `lg:` (1024px)
- **Server state:** TanStack Query hooks in `hooks/` calling services in `services/`
- **Client state:** Zustand stores in `stores/`
- **Form validation:** Zod schemas in `lib/validators.ts`, shared with components
- **Currency formatting:** `formatCurrency()` in `lib/formatters.ts` (IDR)
- **Auth guard:** `ProtectedRoute` checks auth + onboarding status
- **Balance triggers:** Auto-update on transaction insert, auto-reverse on delete
- **Transfers:** Atomic via `execute_transfer()` RPC with `FOR UPDATE` locking

## Important Notes

- Shadcn UI v4 uses `@base-ui/react`, NOT Radix — no `asChild` prop
- No dark mode — light-only earthy/vintage theme
- User-facing text is Indonesian (id-ID)
- `.env` contains Supabase credentials — never commit it
- All database changes must be applied via Supabase MCP or migrations folder

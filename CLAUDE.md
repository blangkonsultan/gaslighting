# Gaslighting — AI Agent Instructions

Read [AGENTS.md](./AGENTS.md) for full project guide (architecture, conventions, testing, Supabase notes).

## Commands

```bash
npm run dev       # Start dev server
npm run build     # Type-check (tsc -b) + production build
npm run lint      # ESLint
npm run test      # Run all tests (vitest run, single pass)
npm run preview   # Preview production build
```

## Environment

Copy `.env.example` to `.env`. Required vars:
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon/public key

## Key Conventions

- **Mobile-first responsive:** base = mobile, `md:` = tablet (768px), `lg:` = desktop (1024px)
- **Touch targets:** All interactive elements must have `touch-target` class (min 44px)
- **Currency:** Always use `formatCurrency()` from `@/lib/formatters` (IDR via `Intl.NumberFormat`)

## Task Handoff

Read `tasks/current.md` at session start. To resume: read `git log --oneline -10` + `git diff`, then continue from the handoff's next steps. Clear completed tasks — they're already in git history.

**During work:** Update `tasks/current.md` after each sub-task so mid-task handoff works. Commit once per completed task.

**Before ending or when context is running low,** update `tasks/current.md` with:
- Status (in-progress / blocked / done)
- Files modified (what changed in each)
- Test results (passing/failing, any errors)
- Decisions made and why
- Next steps — specific enough for a fresh agent to continue

## Stack (quick ref)

React 19 + Vite 8 + TypeScript 6 + Tailwind CSS v4 + Shadcn UI v4 (base-ui, NOT Radix). Backend: Supabase. State: TanStack Query v5 + Zustand. Forms: React Hook Form + Zod v4. Charts: Recharts. Icons: Lucide. Routing: react-router-dom v7.

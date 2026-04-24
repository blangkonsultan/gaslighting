# Gaslighting

Multi-user, multi-account financial management application with automated bill tracking, internal transfers, and interactive data visualization.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript 6 + Vite 8 |
| Styling | Tailwind CSS v4 + Shadcn UI v4 |
| State Management | TanStack Query v5 + Zustand |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Backend | Supabase (PostgreSQL, Auth, RLS, Edge Functions) |
| Deployment | Vercel |

## Features

- **Multi-account management** — Bank, e-wallet, cash, savings, investment accounts
- **Income & expense tracking** — With category-based organization
- **Internal transfers** — Atomic transfers between accounts with balance validation
- **Interactive dashboard** — Summary cards, cash flow charts, expense distribution
- **Advanced reporting** — Filterable transaction history, monthly reports, CSV/PDF export
- **Auto-debit system** — Scheduled recurring bill payments via Edge Functions
- **Mobile-first design** — Bottom navigation on mobile, sidebar on desktop

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (or create one at [supabase.com](https://supabase.com))

### Installation

```bash
git clone <repo-url>
cd gaslighting
npm install
```

### Environment Setup

Create a `.env` file based on `.env.example`:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Database Setup

Run the migrations in `supabase/migrations/` in order, or apply them via the Supabase dashboard:

1. `20260424_create_profiles.sql`
2. `20260424_create_categories.sql` (includes seed data)
3. `20260424_create_accounts.sql`
4. `20260424_create_transactions.sql`
5. `20260424_create_bills.sql`
6. `20260424_create_indexes.sql`
7. `20260424_create_transfer_rpc.sql`

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
src/
├── components/
│   ├── layout/          # AppShell, MobileBottomNav, DesktopSidebar, Header
│   ├── ui/              # Shadcn UI components (auto-generated)
│   ├── shared/          # LoadingSpinner, ErrorBoundary, AmountDisplay, etc.
│   ├── forms/           # AccountForm, TransactionForm, TransferForm, etc.
│   ├── charts/          # CashFlowChart, ExpenseDonutChart, MobileMiniChart
│   ├── dashboard/       # SummaryCards, RecentTransactions
│   └── reports/         # TransactionTable, ReportFilters, ExportButtons
├── pages/               # Route-level components
├── hooks/               # TanStack Query hooks (useAuth, useAccounts, etc.)
├── services/            # Supabase API calls (one file per domain)
├── stores/              # Zustand stores (auth, ui, transaction-filters)
├── lib/                 # Utilities, validators (Zod), formatters, constants
└── types/               # TypeScript types (database, financial)
supabase/
├── migrations/          # SQL migration files
└── functions/           # Edge Functions (auto-debit, balance-validator)
```

## Design System

| Token | Color | Usage |
|-------|-------|-------|
| Primary | `#9AB17A` (Sage) | Buttons, active states, success |
| Secondary | `#C3CC9B` (Olive) | Hover states, secondary accents |
| Background | `#FBE8CE` (Warm Cream) | Main app background |
| Card | `#E4DFB5` (Beige) | Cards, modals, inputs |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and production build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

## License

Private project.

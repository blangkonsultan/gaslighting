import { QueryClient } from "@tanstack/react-query"

export const queryKeys = {
  accounts: {
    all: ["accounts"] as const,
    detail: (id: string) => ["accounts", id] as const,
  },
  transactions: {
    all: ["transactions"] as const,
    filtered: (filters: Record<string, unknown>) => ["transactions", filters] as const,
    recent: (limit: number) => ["transactions", "recent", limit] as const,
  },
  categories: {
    all: ["categories"] as const,
    byType: (type: string) => ["categories", type] as const,
  },
  dashboard: {
    summary: ["dashboard", "summary"] as const,
    cashFlow: (range: { from: string; to: string }) => ["dashboard", "cashFlow", range] as const,
    expenseByCategory: (range: { from: string; to: string }) => ["dashboard", "expenseByCategory", range] as const,
  },
  bills: {
    all: ["bills"] as const,
    active: ["bills", "active"] as const,
  },
  reports: {
    monthly: (month: string) => ["reports", "monthly", month] as const,
    trend: (month: string, months: number) => ["reports", "trend", month, months] as const,
    earliest: ["reports", "earliest"] as const,
  },
} as const

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})

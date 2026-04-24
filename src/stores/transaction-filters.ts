import { create } from "zustand"
import type { TransactionFilters } from "@/types/financial"

interface TransactionFilterState {
  filters: TransactionFilters
  setFilters: (filters: Partial<TransactionFilters>) => void
  resetFilters: () => void
}

export const useTransactionFilters = create<TransactionFilterState>((set) => ({
  filters: {},
  setFilters: (newFilters) =>
    set((state) => ({ filters: { ...state.filters, ...newFilters } })),
  resetFilters: () => set({ filters: {} }),
}))

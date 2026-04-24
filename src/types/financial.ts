import type { Tables, TablesInsert } from "./database"

export type Profile = Tables<"profiles">
export type Account = Tables<"accounts">
export type Category = Tables<"categories">
export type Transaction = Tables<"transactions">
export type Bill = Tables<"bills">

export type AccountInput = Omit<TablesInsert<"accounts">, "user_id" | "balance" | "created_at" | "updated_at">
export type TransactionInput = Omit<TablesInsert<"transactions">, "user_id" | "created_at" | "updated_at">
export type BillInput = Omit<TablesInsert<"bills">, "user_id" | "created_at" | "updated_at" | "status" | "last_processed_at">

export interface DashboardSummary {
  totalBalance: number
  monthlyIncome: number
  monthlyExpense: number
}

export interface CashFlowDataPoint {
  date: string
  income: number
  expense: number
}

export interface ExpenseCategoryData {
  name: string
  amount: number
  percentage: number
  color: string
}

export interface TransactionFilters {
  dateFrom?: string
  dateTo?: string
  categoryId?: string
  accountId?: string
  type?: string
  search?: string
}

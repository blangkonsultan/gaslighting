import { supabase } from "./supabase"
import type { Transaction, TransactionFilters } from "@/types/financial"

export type TransactionListRow = Pick<
  Transaction,
  "id" | "amount" | "type" | "description" | "transaction_date" | "created_at" | "transfer_id"
> & {
  accounts?: { name: string } | null
  categories?: { name: string } | null
}

export const TRANSACTIONS_PAGE_SIZE_DEFAULT = 10

function buildTransactionsListQuery(userId: string, filters: TransactionFilters = {}) {
  let q = supabase
    .from("transactions")
    .select("id,amount,type,description,transaction_date,created_at,transfer_id,accounts(name),categories(name)")
    .eq("user_id", userId)

  if (filters.type) q = q.eq("type", filters.type)
  if (filters.accountId) q = q.eq("account_id", filters.accountId)
  if (filters.categoryId) q = q.eq("category_id", filters.categoryId)
  if (filters.dateFrom) q = q.gte("transaction_date", filters.dateFrom)
  if (filters.dateTo) q = q.lte("transaction_date", filters.dateTo)
  if (filters.search?.trim()) q = q.ilike("description", `%${filters.search.trim()}%`)

  return q
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })
}

export async function getTransactions(userId: string, filters: TransactionFilters = {}): Promise<TransactionListRow[]> {
  const { data, error } = await buildTransactionsListQuery(userId, filters)

  if (error) throw error
  return (data ?? []) as TransactionListRow[]
}

export async function getTransactionsPage(args: {
  userId: string
  filters?: TransactionFilters
  pageIndex: number
  pageSize?: number
}): Promise<TransactionListRow[]> {
  const pageSize = args.pageSize ?? TRANSACTIONS_PAGE_SIZE_DEFAULT
  const from = Math.max(0, args.pageIndex) * pageSize
  const to = from + pageSize - 1

  const { data, error } = await buildTransactionsListQuery(args.userId, args.filters ?? {}).range(from, to)

  if (error) throw error
  return (data ?? []) as TransactionListRow[]
}

export type TransactionDetail = Pick<
  Transaction,
  | "id"
  | "user_id"
  | "account_id"
  | "category_id"
  | "type"
  | "amount"
  | "description"
  | "transaction_date"
  | "created_at"
  | "transfer_id"
>

export async function getTransactionById(userId: string, transactionId: string): Promise<TransactionDetail | null> {
  const { data, error } = await supabase
    .from("transactions")
    .select("id,user_id,account_id,category_id,type,amount,description,transaction_date,created_at,transfer_id")
    .eq("user_id", userId)
    .eq("id", transactionId)
    .maybeSingle()

  if (error) throw error
  return (data ?? null) as TransactionDetail | null
}

export type TransactionUpdateInput = Pick<
  Transaction,
  "account_id" | "category_id" | "type" | "amount" | "description" | "transaction_date"
>

export async function updateTransaction(
  userId: string,
  transactionId: string,
  input: TransactionUpdateInput
): Promise<void> {
  const { error } = await supabase
    .from("transactions")
    .update(input)
    .eq("user_id", userId)
    .eq("id", transactionId)

  if (error) throw error
}

export async function deleteTransaction(userId: string, transactionId: string): Promise<void> {
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("user_id", userId)
    .eq("id", transactionId)

  if (error) throw error
}


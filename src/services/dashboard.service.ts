import { supabase } from "./supabase"
import type { DashboardSummary, Transaction } from "@/types/financial"

function toYmd(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function monthRangeYmd(now = new Date()): { start: string; nextStart: string } {
  const startDate = new Date(now)
  startDate.setDate(1)
  startDate.setHours(0, 0, 0, 0)

  const nextStartDate = new Date(startDate)
  nextStartDate.setMonth(nextStartDate.getMonth() + 1)

  return { start: toYmd(startDate), nextStart: toYmd(nextStartDate) }
}

export async function getDashboardSummary(userId: string): Promise<DashboardSummary> {
  const [{ data: accounts, error: accountsError }, { data: txs, error: txError }] = await Promise.all([
    supabase
      .from("accounts")
      .select("balance")
      .eq("user_id", userId)
      .eq("is_active", true),
    (async () => {
      const { start, nextStart } = monthRangeYmd()
      return await supabase
        .from("transactions")
        .select("amount,type,transaction_date")
        .eq("user_id", userId)
        .gte("transaction_date", start)
        .lt("transaction_date", nextStart)
    })(),
  ])

  if (accountsError) throw accountsError
  if (txError) throw txError

  const totalBalance = (accounts ?? []).reduce((sum, a) => sum + (a.balance ?? 0), 0)

  let monthlyIncome = 0
  let monthlyExpense = 0
  for (const t of (txs ?? []) as Pick<Transaction, "amount" | "type">[]) {
    if (t.type === "income") monthlyIncome += t.amount
    if (t.type === "expense") monthlyExpense += t.amount
  }

  return { totalBalance, monthlyIncome, monthlyExpense }
}

export type RecentTransactionRow = Pick<
  Transaction,
  "id" | "amount" | "type" | "description" | "transaction_date" | "created_at"
> & {
  accounts?: { name: string } | null
  categories?: { name: string } | null
}

export async function getRecentTransactions(userId: string, limit = 5): Promise<RecentTransactionRow[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select(
      "id,amount,type,description,transaction_date,created_at,accounts(name),categories(name)"
    )
    .eq("user_id", userId)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as RecentTransactionRow[]
}


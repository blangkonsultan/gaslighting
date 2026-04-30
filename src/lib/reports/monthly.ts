export type ReportTx = {
  amount: number
  type: "income" | "expense" | string
  categories?: { name: string } | null
  transaction_date: string
}

export type CategoryBreakdown = {
  name: string
  amount: number
  percentage: number
}

export type MonthlyReport = {
  incomeTotal: number
  expenseTotal: number
  netTotal: number
  expenseByCategory: CategoryBreakdown[]
  incomeByCategory: CategoryBreakdown[]
  savingsRate: number
}

export type MonthlyTrendPoint = {
  monthKey: string
  label: string
  income: number
  expense: number
}

function isValidMonthKey(monthKey: string): boolean {
  return /^\d{4}-\d{2}$/.test(monthKey)
}

function daysInMonth(year: number, month1to12: number): number {
  return new Date(year, month1to12, 0).getDate()
}

export function monthRangeYmdFromMonthKey(monthKey: string): { start: string; end: string } {
  if (!isValidMonthKey(monthKey)) {
    throw new Error(`Invalid month key: ${monthKey}`)
  }
  const [y, m] = monthKey.split("-")
  const year = Number(y)
  const month = Number(m)
  const endDay = daysInMonth(year, month)

  const start = `${y}-${m}-01`
  const end = `${y}-${m}-${String(endDay).padStart(2, "0")}`
  return { start, end }
}

export function computeMonthlyReport(transactions: ReportTx[]): MonthlyReport {
  let incomeTotal = 0
  let expenseTotal = 0

  const expenseByCategory = new Map<string, number>()
  const incomeByCategory = new Map<string, number>()

  for (const t of transactions) {
    if (t.type === "income") {
      incomeTotal += t.amount
      const name = t.categories?.name?.trim() || "Tanpa Kategori"
      incomeByCategory.set(name, (incomeByCategory.get(name) ?? 0) + t.amount)
      continue
    }
    if (t.type === "expense") {
      expenseTotal += t.amount
      const name = t.categories?.name?.trim() || "Tanpa Kategori"
      expenseByCategory.set(name, (expenseByCategory.get(name) ?? 0) + t.amount)
    }
  }

  const expenseByCategoryList = Array.from(expenseByCategory.entries())
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: expenseTotal > 0 ? (amount / expenseTotal) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)

  const incomeByCategoryList = Array.from(incomeByCategory.entries())
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: incomeTotal > 0 ? (amount / incomeTotal) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)

  return {
    incomeTotal,
    expenseTotal,
    netTotal: incomeTotal - expenseTotal,
    expenseByCategory: expenseByCategoryList,
    incomeByCategory: incomeByCategoryList,
    savingsRate: incomeTotal > 0 ? ((incomeTotal - expenseTotal) / incomeTotal) * 100 : 0,
  }
}

export function computeTrendData(transactions: ReportTx[], monthKeys: string[]): MonthlyTrendPoint[] {
  const byMonth = new Map<string, { income: number; expense: number }>()

  for (const t of transactions) {
    const monthKey = t.transaction_date.slice(0, 7)
    const current = byMonth.get(monthKey) ?? { income: 0, expense: 0 }
    if (t.type === "income") {
      current.income += t.amount
    } else if (t.type === "expense") {
      current.expense += t.amount
    }
    byMonth.set(monthKey, current)
  }

  const formatter = new Intl.DateTimeFormat("id-ID", { month: "short" })

  return monthKeys.map((monthKey) => {
    const [year, month] = monthKey.split("-").map(Number)
    const date = new Date(year, month - 1, 1)
    const label = formatter.format(date)
    const data = byMonth.get(monthKey) ?? { income: 0, expense: 0 }
    return { monthKey, label, income: data.income, expense: data.expense }
  })
}


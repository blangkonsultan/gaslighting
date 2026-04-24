export type ReportTx = {
  amount: number
  type: "income" | "expense" | string
  categories?: { name: string } | null
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

  for (const t of transactions) {
    if (t.type === "income") {
      incomeTotal += t.amount
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

  return {
    incomeTotal,
    expenseTotal,
    netTotal: incomeTotal - expenseTotal,
    expenseByCategory: expenseByCategoryList,
  }
}


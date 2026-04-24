import { describe, expect, it } from "vitest"
import { computeMonthlyReport, monthRangeYmdFromMonthKey } from "./monthly"

describe("monthRangeYmdFromMonthKey", () => {
  it("returns inclusive YMD range for month", () => {
    expect(monthRangeYmdFromMonthKey("2026-02")).toEqual({
      start: "2026-02-01",
      end: "2026-02-28",
    })
  })
})

describe("computeMonthlyReport", () => {
  it("computes totals and expense breakdown", () => {
    const r = computeMonthlyReport([
      { type: "income", amount: 100_000 },
      { type: "expense", amount: 30_000, categories: { name: "Makan" } },
      { type: "expense", amount: 20_000, categories: { name: "Makan" } },
      { type: "expense", amount: 10_000, categories: { name: "Transport" } },
    ])

    expect(r.incomeTotal).toBe(100_000)
    expect(r.expenseTotal).toBe(60_000)
    expect(r.netTotal).toBe(40_000)

    expect(r.expenseByCategory.map((x) => ({ name: x.name, amount: x.amount }))).toEqual([
      { name: "Makan", amount: 50_000 },
      { name: "Transport", amount: 10_000 },
    ])

    const makan = r.expenseByCategory.find((x) => x.name === "Makan")!
    expect(Math.round(makan.percentage)).toBe(83)
  })
})


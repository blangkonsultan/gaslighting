import { describe, expect, it } from "vitest"
import { computeMonthlyReport, monthRangeYmdFromMonthKey, computeTrendData } from "./monthly"

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
      { type: "income", amount: 100_000, transaction_date: "2026-01-01", categories: null },
      { type: "expense", amount: 30_000, transaction_date: "2026-01-05", categories: { name: "Makan" } },
      { type: "expense", amount: 20_000, transaction_date: "2026-01-10", categories: { name: "Makan" } },
      { type: "expense", amount: 10_000, transaction_date: "2026-01-15", categories: { name: "Transport" } },
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

  it("computes income by category", () => {
    const r = computeMonthlyReport([
      { type: "income", amount: 100_000, transaction_date: "2026-01-01", categories: { name: "Gaji" } },
      { type: "income", amount: 50_000, transaction_date: "2026-01-05", categories: { name: "Bonus" } },
      { type: "expense", amount: 30_000, transaction_date: "2026-01-10", categories: null },
    ])

    expect(r.incomeByCategory.map((x) => ({ name: x.name, amount: x.amount }))).toEqual([
      { name: "Gaji", amount: 100_000 },
      { name: "Bonus", amount: 50_000 },
    ])

    const gaji = r.incomeByCategory.find((x) => x.name === "Gaji")!
    expect(gaji.percentage).toBeCloseTo(66.67, 0.01)
  })

  it("computes savings rate", () => {
    const r1 = computeMonthlyReport([
      { type: "income", amount: 100_000, transaction_date: "2026-01-01", categories: null },
      { type: "expense", amount: 80_000, transaction_date: "2026-01-05", categories: null },
    ])
    expect(r1.savingsRate).toBeCloseTo(20, 0.01)

    const r2 = computeMonthlyReport([
      { type: "income", amount: 100_000, transaction_date: "2026-01-01", categories: null },
      { type: "expense", amount: 100_000, transaction_date: "2026-01-05", categories: null },
    ])
    expect(r2.savingsRate).toBe(0)

    const r3 = computeMonthlyReport([
      { type: "income", amount: 100_000, transaction_date: "2026-01-01", categories: null },
      { type: "expense", amount: 120_000, transaction_date: "2026-01-05", categories: null },
    ])
    expect(r3.savingsRate).toBeCloseTo(-20, 0.01)

    const r4 = computeMonthlyReport([
      { type: "expense", amount: 10_000, transaction_date: "2026-01-01", categories: null },
    ])
    expect(r4.savingsRate).toBe(0)
  })
})

describe("computeTrendData", () => {
  it("returns empty for no transactions", () => {
    const r = computeTrendData([], ["2026-01", "2026-02"])
    expect(r).toEqual([
      { monthKey: "2026-01", label: "Jan", income: 0, expense: 0 },
      { monthKey: "2026-02", label: "Feb", income: 0, expense: 0 },
    ])
  })

  it("groups transactions by month", () => {
    const r = computeTrendData(
      [
        { type: "income", amount: 100_000, transaction_date: "2026-01-15", categories: null },
        { type: "expense", amount: 30_000, transaction_date: "2026-01-20", categories: null },
        { type: "income", amount: 50_000, transaction_date: "2026-02-10", categories: null },
        { type: "expense", amount: 40_000, transaction_date: "2026-02-15", categories: null },
      ],
      ["2026-01", "2026-02"]
    )
    expect(r).toEqual([
      { monthKey: "2026-01", label: "Jan", income: 100_000, expense: 30_000 },
      { monthKey: "2026-02", label: "Feb", income: 50_000, expense: 40_000 },
    ])
  })

  it("fills zeros for missing months", () => {
    const r = computeTrendData(
      [
        { type: "income", amount: 100_000, transaction_date: "2026-01-15", categories: null },
      ],
      ["2025-12", "2026-01", "2026-02"]
    )
    expect(r).toEqual([
      { monthKey: "2025-12", label: "Des", income: 0, expense: 0 },
      { monthKey: "2026-01", label: "Jan", income: 100_000, expense: 0 },
      { monthKey: "2026-02", label: "Feb", income: 0, expense: 0 },
    ])
  })
})


import { describe, expect, it } from "vitest"
import { addDaysYmd, addMonthsYmd, daysInMonthUtc, todayYmd } from "@/lib/dates"

describe("todayYmd", () => {
  it("returns YYYY-MM-DD format", () => {
    const result = todayYmd()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe("daysInMonthUtc", () => {
  it("returns correct days for regular months", () => {
    expect(daysInMonthUtc(2026, 1)).toBe(31) // Jan
    expect(daysInMonthUtc(2026, 4)).toBe(30) // Apr
    expect(daysInMonthUtc(2026, 2)).toBe(28) // Feb non-leap
  })

  it("handles leap years", () => {
    expect(daysInMonthUtc(2024, 2)).toBe(29) // 2024 is leap
    expect(daysInMonthUtc(2000, 2)).toBe(29) // 2000 is leap (div by 400)
    expect(daysInMonthUtc(1900, 2)).toBe(28) // 1900 is not leap (div by 100 but not 400)
  })
})

describe("addDaysYmd", () => {
  it("adds days within the same month", () => {
    expect(addDaysYmd("2026-01-15", 5)).toBe("2026-01-20")
  })

  it("crosses month boundary", () => {
    expect(addDaysYmd("2026-01-28", 5)).toBe("2026-02-02")
  })

  it("crosses year boundary", () => {
    expect(addDaysYmd("2026-12-30", 5)).toBe("2027-01-04")
  })

  it("handles leap year February", () => {
    expect(addDaysYmd("2024-02-27", 2)).toBe("2024-02-29")
    expect(addDaysYmd("2024-02-28", 1)).toBe("2024-02-29")
  })

  it("returns input unchanged for invalid input", () => {
    expect(addDaysYmd("invalid", 5)).toBe("invalid")
  })
})

describe("addMonthsYmd", () => {
  it("adds months within the same year", () => {
    expect(addMonthsYmd("2026-01-15", 3)).toBe("2026-04-15")
  })

  it("crosses year boundary", () => {
    expect(addMonthsYmd("2026-10-15", 5)).toBe("2027-03-15")
  })

  it("clamps day to month length (Jan 31 + 1 month = Feb 28/29)", () => {
    expect(addMonthsYmd("2026-01-31", 1)).toBe("2026-02-28")
    expect(addMonthsYmd("2024-01-31", 1)).toBe("2024-02-29")
  })

  it("clamps day to month length (Aug 31 + 1 = Sep 30)", () => {
    expect(addMonthsYmd("2026-08-31", 1)).toBe("2026-09-30")
  })

  it("handles adding 12 months (same date next year)", () => {
    expect(addMonthsYmd("2026-03-15", 12)).toBe("2027-03-15")
  })

  it("returns input unchanged for invalid input", () => {
    expect(addMonthsYmd("invalid", 1)).toBe("invalid")
  })
})

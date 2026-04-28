import { describe, expect, it } from "vitest"
import { formatIdrIntegerInput, IDR_INTEGER_REGEX, isIdrIntegerString, parseIdrInteger } from "@/lib/money"

describe("money", () => {
  it("accepts valid IDR integer strings with dot thousand separators", () => {
    const valid = ["0", "1", "12", "123", "1000", "9999999", "1.000", "150.000.000"]
    for (const v of valid) {
      expect(IDR_INTEGER_REGEX.test(v)).toBe(true)
      expect(isIdrIntegerString(v)).toBe(true)
      expect(Number.isFinite(parseIdrInteger(v))).toBe(true)
    }
  })

  it("rejects invalid IDR integer strings", () => {
    const invalid = [
      "",
      "01",
      "1.00",
      "1.0000",
      "1000.000",
      "150,000",
      "150.000.000,00",
      "-1",
      "  ",
      "1.",
      ".1",
    ]
    for (const v of invalid) {
      expect(isIdrIntegerString(v)).toBe(false)
      expect(Number.isNaN(parseIdrInteger(v))).toBe(true)
    }
  })

  it("parses dot-separated strings to numbers", () => {
    expect(parseIdrInteger("150.000.000")).toBe(150000000)
    expect(parseIdrInteger("1.000")).toBe(1000)
    expect(parseIdrInteger("1000")).toBe(1000)
    expect(parseIdrInteger("0")).toBe(0)
  })

  it("formats user input to dot-separated thousands", () => {
    expect(formatIdrIntegerInput("90000000")).toBe("90.000.000")
    expect(formatIdrIntegerInput("90.000.000")).toBe("90.000.000")
    expect(formatIdrIntegerInput("00012")).toBe("12")
    expect(formatIdrIntegerInput("")).toBe("")
  })
})


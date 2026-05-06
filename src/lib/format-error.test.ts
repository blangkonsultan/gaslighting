import { describe, expect, it } from "vitest"
import { formatErrorMessage } from "@/lib/format-error"

describe("formatErrorMessage", () => {
  it("formats PostgREST-style objects", () => {
    expect(
      formatErrorMessage({
        message: "relation \"foo\" does not exist",
        details: null,
        hint: null,
        code: "42P01",
      })
    ).toContain("does not exist")
    expect(
      formatErrorMessage({
        message: "permission denied",
        details: "detail line",
        hint: "hint line",
        code: "42501",
      })
    ).toMatch(/permission denied.*detail line.*hint line.*\[42501\]/)
  })

  it("handles Error and strings", () => {
    expect(formatErrorMessage(new Error("x"))).toBe("x")
    expect(formatErrorMessage("plain")).toBe("plain")
  })
})

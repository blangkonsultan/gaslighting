import { describe, expect, it } from "vitest"
import { transferSchema } from "@/lib/validators"

describe("transferSchema", () => {
  it("accepts a valid transfer input", () => {
    const res = transferSchema.safeParse({
      from_account_id: "11111111-1111-4111-8111-111111111111",
      to_account_id: "22222222-2222-4222-8222-222222222222",
      amount: "10.000",
      description: "pindah dana",
      transaction_date: "2026-04-24",
    })
    expect(res.success).toBe(true)
  })

  it("rejects when from and to accounts are the same", () => {
    const res = transferSchema.safeParse({
      from_account_id: "11111111-1111-4111-8111-111111111111",
      to_account_id: "11111111-1111-4111-8111-111111111111",
      amount: "10.000",
      transaction_date: "2026-04-24",
    })
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.error.flatten().fieldErrors.to_account_id?.[0]).toContain("tidak boleh sama")
    }
  })

  it("rejects zero/invalid amount", () => {
    const res = transferSchema.safeParse({
      from_account_id: "11111111-1111-4111-8111-111111111111",
      to_account_id: "22222222-2222-4222-8222-222222222222",
      amount: "0",
      transaction_date: "2026-04-24",
    })
    expect(res.success).toBe(false)
  })
})


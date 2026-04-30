import { describe, expect, it } from "vitest"
import { todayYmd } from "@/lib/dates"
import {
  loginSchema,
  registerSchema,
  onboardingAccountSchema,
  accountSchema,
  transactionSchema,
  billSchema,
  adminCategorySchema,
  adminAccountPresetSchema,
} from "@/lib/validators"

describe("loginSchema", () => {
  it("accepts valid input", () => {
    expect(loginSchema.safeParse({ email: "user@example.com", password: "123456" }).success).toBe(true)
  })

  it("rejects invalid email", () => {
    const res = loginSchema.safeParse({ email: "bad", password: "123456" })
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error.flatten().fieldErrors.email?.[0]).toContain("tidak valid")
  })

  it("rejects short password", () => {
    const res = loginSchema.safeParse({ email: "user@example.com", password: "123" })
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error.flatten().fieldErrors.password?.[0]).toContain("minimal")
  })
})

describe("registerSchema", () => {
  it("accepts valid input", () => {
    expect(registerSchema.safeParse({ email: "user@example.com", password: "123456", full_name: "John" }).success).toBe(true)
  })

  it("rejects missing full_name", () => {
    const res = registerSchema.safeParse({ email: "user@example.com", password: "123456", full_name: "" })
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error.flatten().fieldErrors.full_name?.[0]).toContain("wajib diisi")
  })
})

describe("onboardingAccountSchema", () => {
  it("accepts valid input", () => {
    expect(onboardingAccountSchema.safeParse({ name: "BCA", type: "bank", initial_balance: "1.000.000" }).success).toBe(true)
    expect(onboardingAccountSchema.safeParse({ name: "BCA", type: "bank", initial_balance: "1000" }).success).toBe(true)
  })

  it("rejects invalid amount format", () => {
    const res = onboardingAccountSchema.safeParse({ name: "BCA", type: "bank", initial_balance: "abc" })
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error.flatten().fieldErrors.initial_balance?.[0]).toContain("tidak valid")
  })
})

describe("accountSchema", () => {
  it("accepts valid input with optional notes", () => {
    expect(accountSchema.safeParse({ name: "GoPay", type: "ewallet", initial_balance: "500.000", notes: "backup" }).success).toBe(true)
  })

  it("accepts valid input without notes", () => {
    expect(accountSchema.safeParse({ name: "GoPay", type: "ewallet", initial_balance: "500.000" }).success).toBe(true)
    expect(accountSchema.safeParse({ name: "GoPay", type: "ewallet", initial_balance: "1000" }).success).toBe(true)
  })
})

describe("transactionSchema", () => {
  const valid = {
    account_id: "11111111-1111-4111-8111-111111111111",
    category_id: "22222222-2222-4222-8222-222222222222",
    type: "expense",
    amount: "150.000",
    description: "makan siang",
    transaction_date: "2026-04-25",
  }

  it("accepts valid input", () => {
    expect(transactionSchema.safeParse(valid).success).toBe(true)
  })

  it("rejects zero amount", () => {
    const res = transactionSchema.safeParse({ ...valid, amount: "0" })
    expect(res.success).toBe(false)
  })

  it("rejects invalid UUID", () => {
    const res = transactionSchema.safeParse({ ...valid, account_id: "not-a-uuid" })
    expect(res.success).toBe(false)
  })
})

describe("billSchema", () => {
  const today = todayYmd()

  const valid = {
    account_id: "11111111-1111-4111-8111-111111111111",
    category_id: "",
    name: "Netflix",
    amount: "150.000",
    type: "expense",
    frequency: "monthly",
    next_date: today,
    can_end: false,
    end_date: "",
    description: "",
  }

  it("accepts valid input", () => {
    expect(billSchema.safeParse(valid).success).toBe(true)
  })

  it("rejects past next_date", () => {
    const res = billSchema.safeParse({ ...valid, next_date: "2020-01-01" })
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error.flatten().fieldErrors.next_date?.[0]).toContain("minimal")
  })

  it("rejects zero amount", () => {
    const res = billSchema.safeParse({ ...valid, amount: "0" })
    expect(res.success).toBe(false)
  })
})

describe("adminCategorySchema", () => {
  it("accepts valid input", () => {
    expect(adminCategorySchema.safeParse({ name: "Makanan", type: "expense", icon: "utensils", color: "#FF0000", sort_order: 1 }).success).toBe(true)
  })

  it("rejects empty name", () => {
    const res = adminCategorySchema.safeParse({ name: "", type: "expense", icon: "utensils", color: "#FF0000", sort_order: 0 })
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error.flatten().fieldErrors.name?.[0]).toContain("wajib diisi")
  })
})

describe("adminAccountPresetSchema", () => {
  it("accepts valid input", () => {
    expect(adminAccountPresetSchema.safeParse({ name: "BCA", type: "bank", icon: "wallet", color: "#0000FF", sort_order: 0 }).success).toBe(true)
  })

  it("rejects empty name", () => {
    const res = adminAccountPresetSchema.safeParse({ name: "", type: "bank", icon: "wallet", color: "#0000FF", sort_order: 0 })
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error.flatten().fieldErrors.name?.[0]).toContain("wajib diisi")
  })
})

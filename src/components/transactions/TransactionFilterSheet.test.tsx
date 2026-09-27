import { describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { TransactionFilterSheet } from "./TransactionFilterSheet"
import type { Account, Category } from "@/types/financial"

describe("TransactionFilterSheet", () => {
  const mockAccounts: Account[] = [
    {
      id: "acc-1",
      name: "BCA Utama",
      type: "bank",
      balance: 10000000,
      currency: "IDR",
      initial_balance: 0,
      is_active: true,
      user_id: "user-1",
      color: null,
      icon: null,
      notes: null,
      created_at: "",
      updated_at: "",
    },
  ]

  const mockCategories: Category[] = [
    {
      id: "cat-1",
      name: "Makanan",
      type: "expense",
      color: null,
      icon: null,
      is_global: true,
      user_id: null,
      created_at: "",
      sort_order: 1,
    },
  ]

  const mockTags = ["#makan", "#liburan", "#belanja"]

  it("renders filter options when open", () => {
    render(
      <TransactionFilterSheet
        open={true}
        onOpenChange={vi.fn()}
        filters={{}}
        onApplyFilters={vi.fn()}
        onResetFilters={vi.fn()}
        accounts={mockAccounts}
        categories={mockCategories}
        userTags={mockTags}
      />
    )

    expect(screen.getByText("Filter Lanjutan")).toBeInTheDocument()
    expect(screen.getByText("Tipe Transaksi")).toBeInTheDocument()
    expect(screen.getByText("#makan")).toBeInTheDocument()
    expect(screen.getByText("#liburan")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Terapkan Filter" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Reset Semua" })).toBeInTheDocument()
  })

  it("selects tags and submits filter on apply", () => {
    const handleApply = vi.fn()
    const handleOpenChange = vi.fn()

    render(
      <TransactionFilterSheet
        open={true}
        onOpenChange={handleOpenChange}
        filters={{}}
        onApplyFilters={handleApply}
        onResetFilters={vi.fn()}
        accounts={mockAccounts}
        categories={mockCategories}
        userTags={mockTags}
      />
    )

    // Click #makan tag chip
    const tagChip = screen.getByText("#makan")
    fireEvent.click(tagChip)

    // Click Terapkan Filter
    const applyBtn = screen.getByRole("button", { name: "Terapkan Filter" })
    fireEvent.click(applyBtn)

    expect(handleApply).toHaveBeenCalledWith(
      expect.objectContaining({
        tags: ["#makan"],
      })
    )
    expect(handleOpenChange).toHaveBeenCalledWith(false)
  })

  it("resets filter on Reset Semua click", () => {
    const handleReset = vi.fn()
    const handleOpenChange = vi.fn()

    render(
      <TransactionFilterSheet
        open={true}
        onOpenChange={handleOpenChange}
        filters={{ tags: ["#makan"] }}
        onApplyFilters={vi.fn()}
        onResetFilters={handleReset}
        accounts={mockAccounts}
        categories={mockCategories}
        userTags={mockTags}
      />
    )

    const resetBtn = screen.getByRole("button", { name: "Reset Semua" })
    fireEvent.click(resetBtn)

    expect(handleReset).toHaveBeenCalled()
    expect(handleOpenChange).toHaveBeenCalledWith(false)
  })
})

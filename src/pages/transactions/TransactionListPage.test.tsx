import { describe, expect, it, beforeEach, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import TransactionListPage from "@/pages/transactions/TransactionListPage"
import { useAuthStore } from "@/stores/auth-store"
import { useTransactionFilters } from "@/stores/transaction-filters"
import type { Profile } from "@/types/financial"

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>()

  return {
    ...actual,
    useInfiniteQuery: () => ({
      data: { pages: [[{ id: "1", amount: 100000, type: "expense", description: "Makan siang", transaction_date: "2026-01-01", accounts: { name: "BCA" } }]] },
      isLoading: false,
      isError: false,
      hasNextPage: false,
      isFetching: false,
      isFetchingNextPage: false,
    }),
    useQuery: ({ queryKey }: { queryKey: string[] }) => {
      if (queryKey[0] === "accounts") return { data: [{ id: "acc-1", name: "BCA" }] }
      if (queryKey[0] === "categories") return { data: [{ id: "cat-1", name: "Makanan", type: "expense" }, { id: "cat-2", name: "Gaji", type: "income" }] }
      return { data: [] }
    },
  }
})

vi.mock("@/services/transactions.service", () => ({
  getTransactionsPage: vi.fn(),
  TRANSACTIONS_PAGE_SIZE_DEFAULT: 10,
}))

vi.mock("@/services/accounts.service", () => ({
  getAccounts: vi.fn(),
}))

vi.mock("@/services/admin.service", () => ({
  getCategories: vi.fn(),
}))

const mockProfile: Profile = {
  id: "user-1",
  email: "test@test.com",
  full_name: "Test",
  role: "user",
  onboarding_completed: true,
} as unknown as Profile

beforeEach(() => {
  useAuthStore.setState({ profile: mockProfile, isLoading: false })
  useTransactionFilters.getState().resetFilters()
})

function renderPage() {
  return render(
    <MemoryRouter>
      <TransactionListPage />
    </MemoryRouter>
  )
}

describe("TransactionListPage filters", () => {
  it("renders category and account select filters", () => {
    renderPage()

    expect(screen.getByText("Semua kategori")).toBeInTheDocument()
    expect(screen.getByText("Semua rekening")).toBeInTheDocument()
  })

  it("renders search input", () => {
    renderPage()

    expect(screen.getByPlaceholderText("Cari deskripsi…")).toBeInTheDocument()
  })

  it("does not show reset button when no filters are active", () => {
    renderPage()

    expect(screen.queryByRole("button", { name: "Reset filter" })).not.toBeInTheDocument()
  })

  it("shows reset button when a category filter is set", () => {
    useTransactionFilters.getState().setFilters({ categoryId: "cat-1" })
    renderPage()

    expect(screen.getByRole("button", { name: "Reset filter" })).toBeInTheDocument()
  })

  it("shows reset button when an account filter is set", () => {
    useTransactionFilters.getState().setFilters({ accountId: "acc-1" })
    renderPage()

    expect(screen.getByRole("button", { name: "Reset filter" })).toBeInTheDocument()
  })

  it("shows reset button when search filter is set", () => {
    useTransactionFilters.getState().setFilters({ search: "makan" })
    renderPage()

    expect(screen.getByRole("button", { name: "Reset filter" })).toBeInTheDocument()
  })

  it("clears all filters when reset is clicked", () => {
    useTransactionFilters.getState().setFilters({ search: "makan", categoryId: "cat-1", accountId: "acc-1" })
    renderPage()

    screen.getByRole("button", { name: "Reset filter" }).click()

    expect(useTransactionFilters.getState().filters).toEqual({})
  })
})

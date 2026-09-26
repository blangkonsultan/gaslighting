import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { Tables } from "@/types/database"
import AdminCategoriesPage from "./AdminCategoriesPage"
import * as adminService from "@/services/admin.service"

vi.mock("@/services/admin.service", () => ({
  getCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}))

const mockCategories: Tables<"categories">[] = [
  {
    id: "cat-1",
    name: "Gaji",
    type: "income",
    icon: "circle",
    color: "#9AB17A",
    sort_order: 1,
    created_at: "2026-01-01T00:00:00Z",
    is_global: true,
    user_id: null,
  },
  {
    id: "cat-2",
    name: "Makanan",
    type: "expense",
    icon: "circle",
    color: "#E27D60",
    sort_order: 2,
    created_at: "2026-01-01T00:00:00Z",
    is_global: true,
    user_id: null,
  },
]

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe("AdminCategoriesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(adminService.getCategories).mockResolvedValue(mockCategories)
  })

  it("renders card layout with vertical stack and responsive grid items", async () => {
    renderWithClient(<AdminCategoriesPage />)

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText(/Pemasukan \(1\)/i)).toBeInTheDocument()
      expect(screen.getByText(/Pengeluaran \(1\)/i)).toBeInTheDocument()
    })

    const incomeTitle = screen.getByText(/Pemasukan \(1\)/i)
    const expenseTitle = screen.getByText(/Pengeluaran \(1\)/i)

    // Verify neutral CardTitle typography (no text-primary or text-destructive)
    expect(incomeTitle).toHaveClass("text-base")
    expect(incomeTitle).not.toHaveClass("text-primary")
    expect(expenseTitle).toHaveClass("text-base")
    expect(expenseTitle).not.toHaveClass("text-destructive")

    // Verify outer card container is vertical stack (flex flex-col gap-4)
    const cardContainer = incomeTitle.closest('[data-slot="card"]')?.parentElement
    expect(cardContainer).toHaveClass("flex", "flex-col", "gap-4")
    expect(cardContainer).not.toHaveClass("grid")

    // Verify inner card content has responsive grid (grid gap-1 sm:grid-cols-2)
    const incomeCardContent = incomeTitle.closest('[data-slot="card"]')?.querySelector('[data-slot="card-content"]')
    const expenseCardContent = expenseTitle.closest('[data-slot="card"]')?.querySelector('[data-slot="card-content"]')

    expect(incomeCardContent).toHaveClass("grid", "gap-1", "sm:grid-cols-2")
    expect(incomeCardContent).not.toHaveClass("flex-col")
    expect(expenseCardContent).toHaveClass("grid", "gap-1", "sm:grid-cols-2")
    expect(expenseCardContent).not.toHaveClass("flex-col")
  })

  it("renders dialog form with full-width select and 44px color picker swatch", async () => {
    renderWithClient(<AdminCategoriesPage />)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /tambah/i })).toBeInTheDocument()
    })

    // Open Tambah Kategori dialog
    fireEvent.click(screen.getByRole("button", { name: /tambah/i }))

    expect(screen.getByRole("heading", { name: /tambah kategori/i })).toBeInTheDocument()

    // SelectTrigger has touch-target and w-full, and displays label "Pengeluaran" (not raw value "expense")
    const selectTrigger = screen.getByRole("combobox")
    expect(selectTrigger).toHaveClass("touch-target", "w-full")
    expect(selectTrigger).toHaveTextContent("Pengeluaran")
    expect(selectTrigger).not.toHaveTextContent("expense")

    // Color swatch input has 44px (h-11 w-11), rounded-lg, shrink-0, and focus ring
    const colorInput = document.querySelector('input[type="color"]')
    expect(colorInput).not.toBeNull()
    expect(colorInput).toHaveClass("h-11", "w-11", "shrink-0", "rounded-lg", "border", "border-border")
  })
})

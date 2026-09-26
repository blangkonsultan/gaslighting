import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { Tables } from "@/types/database"
import AdminAccountPresetsPage from "./AdminAccountPresetsPage"
import * as adminService from "@/services/admin.service"

vi.mock("@/services/admin.service", () => ({
  getAccountPresets: vi.fn(),
  createAccountPreset: vi.fn(),
  updateAccountPreset: vi.fn(),
  deleteAccountPreset: vi.fn(),
}))

const mockPresets: Tables<"account_presets">[] = [
  {
    id: "preset-1",
    name: "BCA",
    type: "bank",
    icon: "wallet",
    color: "#9AB17A",
    sort_order: 1,
    created_at: "2026-01-01T00:00:00Z",
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

describe("AdminAccountPresetsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(adminService.getAccountPresets).mockResolvedValue(mockPresets)
  })

  it("renders card layout with vertical stack and responsive grid items", async () => {
    renderWithClient(<AdminAccountPresetsPage />)

    await waitFor(() => {
      expect(screen.getByText(/Bank \(1\)/i)).toBeInTheDocument()
    })

    const bankTitle = screen.getByText(/Bank \(1\)/i)
    expect(bankTitle).toHaveClass("text-base")

    // Outer container is flex flex-col gap-4
    const cardContainer = bankTitle.closest('[data-slot="card"]')?.parentElement
    expect(cardContainer).toHaveClass("flex", "flex-col", "gap-4")

    // CardContent has responsive grid
    const cardContent = bankTitle.closest('[data-slot="card"]')?.querySelector('[data-slot="card-content"]')
    expect(cardContent).toHaveClass("grid", "gap-1", "sm:grid-cols-2")
  })

  it("renders dialog form with full-width select and 44px color picker swatch", async () => {
    renderWithClient(<AdminAccountPresetsPage />)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /tambah/i })).toBeInTheDocument()
    })

    // Open Tambah Preset dialog
    fireEvent.click(screen.getByRole("button", { name: /tambah/i }))

    expect(screen.getByRole("heading", { name: /tambah preset/i })).toBeInTheDocument()

    // SelectTrigger has touch-target and w-full
    const selectTrigger = screen.getByRole("combobox")
    expect(selectTrigger).toHaveClass("touch-target", "w-full")

    // Color swatch input has 44px (h-11 w-11), rounded-lg, shrink-0, and focus ring
    const colorInput = document.querySelector('input[type="color"]')
    expect(colorInput).not.toBeNull()
    expect(colorInput).toHaveClass("h-11", "w-11", "shrink-0", "rounded-lg", "border", "border-border")
  })
})

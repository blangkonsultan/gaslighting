import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import ReportsPage from "./ReportsPage"
import { toast } from "sonner"
import * as exportCsv from "@/lib/reports/export-csv"

vi.mock("@/stores/auth-store", () => ({
  useAuthStore: () => ({
    profile: { id: "user-123", email: "test@example.com", full_name: "Test User" },
  }),
}))

const mockTransactions = [
  {
    id: "tx-1",
    amount: 1000000,
    type: "income",
    description: "Bonus",
    transaction_date: "2026-09-01",
    created_at: "2026-09-01T00:00:00Z",
    transfer_id: null,
    accounts: { name: "BCA Utama" },
    categories: { name: "Bonus" },
  },
]

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>()
  return {
    ...actual,
    useQueryClient: () => ({
      prefetchQuery: vi.fn(),
    }),
    useQuery: ({ queryKey }: { queryKey: unknown[] }) => {
      const key = queryKey[0] as string
      if (key === "reports" && queryKey[1] === "monthly") {
        return {
          data: mockTransactions,
          isLoading: false,
          isError: false,
        }
      }
      if (key === "reports" && queryKey[1] === "trend") {
        return {
          data: [],
          isLoading: false,
          isError: false,
        }
      }
      if (key === "reports" && queryKey[1] === "earliest") {
        return {
          data: "2026-01-01",
          isLoading: false,
          isError: false,
        }
      }
      return { data: null, isLoading: false, isError: false }
    },
  }
})

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe("ReportsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.print = vi.fn()
  })

  it("renders page title and export button when data is loaded", () => {
    render(<ReportsPage />)

    expect(screen.getByRole("heading", { name: "Laporan" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Menu Ekspor Laporan/i })).toBeInTheDocument()
  })

  it("triggers CSV export and toast when Unduh CSV is clicked", () => {
    const downloadSpy = vi.spyOn(exportCsv, "downloadCsvFile").mockImplementation(() => {})

    render(<ReportsPage />)

    const exportBtn = screen.getByRole("button", { name: /Menu Ekspor Laporan/i })
    fireEvent.click(exportBtn)

    const csvOption = screen.getByText(/Unduh CSV/i)
    fireEvent.click(csvOption)

    expect(downloadSpy).toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalledWith("Laporan CSV berhasil diunduh!")
  })

  it("opens PrintPreviewDialog when Cetak / Simpan PDF is clicked", () => {
    render(<ReportsPage />)

    const exportBtn = screen.getByRole("button", { name: /Menu Ekspor Laporan/i })
    fireEvent.click(exportBtn)

    const printOption = screen.getByText(/Cetak \/ Simpan PDF/i)
    fireEvent.click(printOption)

    expect(screen.getByText("Pratinjau Laporan Keuangan")).toBeInTheDocument()
  })
})

import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { PrintPreviewDialog } from "./PrintPreviewDialog"
import type { MonthlyReport } from "@/lib/reports/monthly"

describe("PrintPreviewDialog", () => {
  const mockReport: MonthlyReport = {
    incomeTotal: 10000000,
    expenseTotal: 5000000,
    netTotal: 5000000,
    savingsRate: 50,
    expenseByCategory: [],
    incomeByCategory: [],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    window.print = vi.fn()
  })

  it("renders preview dialog and triggers window.print on button click", () => {
    render(
      <PrintPreviewDialog
        open={true}
        onOpenChange={vi.fn()}
        monthLabel="September 2026"
        report={mockReport}
        transactions={[]}
        userName="Bagas"
      />
    )

    expect(screen.getByText("Pratinjau Laporan Keuangan")).toBeInTheDocument()
    expect(screen.getByText(/Periode September 2026/)).toBeInTheDocument()

    const printBtn = screen.getByRole("button", { name: /Cetak \/ Simpan PDF/i })
    expect(printBtn).toBeInTheDocument()

    fireEvent.click(printBtn)
    expect(window.print).toHaveBeenCalled()
  })

  it("returns null when report is null", () => {
    const { container } = render(
      <PrintPreviewDialog
        open={true}
        onOpenChange={vi.fn()}
        monthLabel="September 2026"
        report={null}
        transactions={[]}
      />
    )

    expect(container.firstChild).toBeNull()
  })
})

import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { PrintableReport } from "./PrintableReport"
import type { MonthlyReport } from "@/lib/reports/monthly"
import type { TransactionListRow } from "@/services/transactions.service"

describe("PrintableReport", () => {
  const mockReport: MonthlyReport = {
    incomeTotal: 15000000,
    expenseTotal: 2500000,
    netTotal: 12500000,
    savingsRate: 83.3,
    expenseByCategory: [
      { name: "Makanan", amount: 1500000, percentage: 60 },
      { name: "Tagihan", amount: 1000000, percentage: 40 },
    ],
    incomeByCategory: [
      { name: "Gaji", amount: 15000000, percentage: 100 },
    ],
  }

  const mockTxs: TransactionListRow[] = [
    {
      id: "tx-1",
      transaction_date: "2026-09-01",
      type: "income",
      amount: 15000000,
      description: "Gaji Kantor",
      created_at: "2026-09-01T10:00:00Z",
      transfer_id: null,
      accounts: { name: "BCA Utama" },
      categories: { name: "Gaji" },
    },
    {
      id: "tx-2",
      transaction_date: "2026-09-27",
      type: "expense",
      amount: 250000,
      description: "Tagihan Listrik PLN",
      created_at: "2026-09-27T10:00:00Z",
      transfer_id: null,
      accounts: { name: "BCA Utama" },
      categories: { name: "Tagihan" },
    },
  ]

  it("renders report header and user metadata", () => {
    render(
      <PrintableReport
        monthLabel="September 2026"
        report={mockReport}
        transactions={mockTxs}
        userName="Bagas"
      />
    )

    expect(screen.getByText("GASLIGHTING")).toBeInTheDocument()
    expect(screen.getByText("Laporan Keuangan Bulanan")).toBeInTheDocument()
    expect(screen.getByText(/September 2026/)).toBeInTheDocument()
    expect(screen.getByText(/Bagas/)).toBeInTheDocument()
  })

  it("renders summary cards with formatted currency", () => {
    render(
      <PrintableReport
        monthLabel="September 2026"
        report={mockReport}
        transactions={mockTxs}
      />
    )

    expect(screen.getByText("Total Pemasukan")).toBeInTheDocument()
    expect(screen.getByText("Total Pengeluaran")).toBeInTheDocument()
    expect(screen.getByText("Arus Kas Bersih")).toBeInTheDocument()
    expect(screen.getByText("83.3%")).toBeInTheDocument()
  })

  it("renders category breakdowns", () => {
    render(
      <PrintableReport
        monthLabel="September 2026"
        report={mockReport}
        transactions={mockTxs}
      />
    )

    expect(screen.getByText("Makanan")).toBeInTheDocument()
    expect(screen.getAllByText("Tagihan").length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText("60.0%")).toBeInTheDocument()
  })

  it("renders transaction table rows", () => {
    render(
      <PrintableReport
        monthLabel="September 2026"
        report={mockReport}
        transactions={mockTxs}
      />
    )

    expect(screen.getByText("Gaji Kantor")).toBeInTheDocument()
    expect(screen.getByText("Tagihan Listrik PLN")).toBeInTheDocument()
    expect(screen.getByText("Pemasukan")).toBeInTheDocument()
    expect(screen.getByText("Pengeluaran")).toBeInTheDocument()
  })
})

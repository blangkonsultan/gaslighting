import { describe, expect, it, vi } from "vitest"
import {
  escapeCsvField,
  formatTransactionType,
  generateTransactionsCsv,
  downloadCsvFile,
} from "./export-csv"
import type { TransactionListRow } from "@/services/transactions.service"

describe("export-csv", () => {
  describe("escapeCsvField", () => {
    it("returns empty string for null and undefined", () => {
      expect(escapeCsvField(null)).toBe("")
      expect(escapeCsvField(undefined)).toBe("")
    })

    it("leaves regular strings and numbers unchanged", () => {
      expect(escapeCsvField("Gaji")).toBe("Gaji")
      expect(escapeCsvField(1500000)).toBe("1500000")
    })

    it("wraps fields with commas in quotes", () => {
      expect(escapeCsvField("Makan, Minum")).toBe('"Makan, Minum"')
    })

    it("escapes quotes by doubling them and wraps in quotes", () => {
      expect(escapeCsvField('Beli "Kopi"')).toBe('"Beli ""Kopi"""')
    })

    it("wraps fields with newlines in quotes", () => {
      expect(escapeCsvField("Baris 1\nBaris 2")).toBe('"Baris 1\nBaris 2"')
    })
  })

  describe("formatTransactionType", () => {
    it("formats known transaction types to Indonesian labels", () => {
      expect(formatTransactionType("income")).toBe("Pemasukan")
      expect(formatTransactionType("expense")).toBe("Pengeluaran")
      expect(formatTransactionType("transfer")).toBe("Transfer")
    })

    it("falls back to raw string for unknown type", () => {
      expect(formatTransactionType("adjustment")).toBe("adjustment")
    })
  })

  describe("generateTransactionsCsv", () => {
    const mockTxs: TransactionListRow[] = [
      {
        id: "tx-1",
        transaction_date: "2026-09-25",
        type: "income",
        amount: 15000000,
        description: "Gaji Bulanan",
        created_at: "2026-09-25T10:00:00Z",
        transfer_id: null,
        accounts: { name: "BCA Utama" },
        categories: { name: "Gaji" },
      },
      {
        id: "tx-2",
        transaction_date: "2026-09-26",
        type: "expense",
        amount: 350000,
        description: 'Belanja "Bulanan", Sayur',
        created_at: "2026-09-26T10:00:00Z",
        transfer_id: null,
        accounts: { name: "BCA Utama" },
        categories: { name: "Belanja" },
      },
    ]

    it("starts with UTF-8 BOM", () => {
      const csv = generateTransactionsCsv(mockTxs)
      expect(csv.startsWith("\uFEFF")).toBe(true)
    })

    it("includes headers and transaction rows", () => {
      const csv = generateTransactionsCsv(mockTxs)
      expect(csv).toContain("Tanggal,Tipe,Rekening,Kategori,Deskripsi,Nominal,Format Nominal")
      expect(csv).toContain("2026-09-25,Pemasukan,BCA Utama,Gaji,Gaji Bulanan,15000000")
      // Check escaping of quotes and commas
      expect(csv).toContain('"Belanja ""Bulanan"", Sayur"')
    })

    it("includes summary section when includeSummary is true", () => {
      const csv = generateTransactionsCsv(mockTxs, { includeSummary: true })
      expect(csv).toContain('"--- RINGKASAN ---"')
      expect(csv).toContain("Total Pemasukan,,,,,15000000")
      expect(csv).toContain("Total Pengeluaran,,,,,350000")
      expect(csv).toContain("Arus Kas Bersih,,,,,14650000")
    })
  })

  describe("downloadCsvFile", () => {
    it("creates blob and link and clicks to trigger download", () => {
      const clickMock = vi.fn()
      const appendChildMock = vi.spyOn(document.body, "appendChild").mockImplementation(() => null as unknown as Node)
      const removeChildMock = vi.spyOn(document.body, "removeChild").mockImplementation(() => null as unknown as Node)

      vi.spyOn(document, "createElement").mockReturnValue({
        setAttribute: vi.fn(),
        style: {},
        click: clickMock,
      } as unknown as HTMLAnchorElement)

      global.URL.createObjectURL = vi.fn().mockReturnValue("blob:http://localhost/123")
      global.URL.revokeObjectURL = vi.fn()

      downloadCsvFile("test-report.csv", "sample-csv-content")

      expect(clickMock).toHaveBeenCalled()
      expect(appendChildMock).toHaveBeenCalled()
      expect(removeChildMock).toHaveBeenCalled()
    })
  })
})

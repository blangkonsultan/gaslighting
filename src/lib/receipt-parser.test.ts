import { describe, expect, it } from "vitest"
import {
  cleanNumericString,
  extractMerchant,
  extractDate,
  extractTotalAmount,
  parseReceiptText,
} from "./receipt-parser"

describe("receipt-parser", () => {
  describe("cleanNumericString", () => {
    it("parses IDR amounts formatted with dots", () => {
      expect(cleanNumericString("Rp 125.000")).toBe(125000)
      expect(cleanNumericString("Rp. 35.500")).toBe(35500)
      expect(cleanNumericString("IDR 1.250.000")).toBe(1250000)
    })

    it("parses amounts with decimals", () => {
      expect(cleanNumericString("Rp 125.000,00")).toBe(125000)
      expect(cleanNumericString("25.000,00")).toBe(25000)
    })

    it("parses unformatted digits", () => {
      expect(cleanNumericString("150000")).toBe(150000)
    })

    it("returns null for non-numeric or zero", () => {
      expect(cleanNumericString("Rp 0")).toBeNull()
      expect(cleanNumericString("abc")).toBeNull()
    })
  })

  describe("extractMerchant", () => {
    it("recognizes known Indonesian merchants", () => {
      expect(extractMerchant(["PT. INDOMARCO PRISMATAMA", "INDOMARET RAYA"])?.name).toBe("Indomaret")
      expect(extractMerchant(["ALFAMART DIPONEGORO"])?.name).toBe("Alfamart")
      expect(extractMerchant(["LION SUPER INDO", "Jl. Sudirman"])?.name).toBe("Super Indo")
      expect(extractMerchant(["STARBUCKS COFFEE INDONESIA"])?.name).toBe("Starbucks")
      expect(extractMerchant(["SPBU PERTAMINA 34-12345"])?.name).toBe("Pertamina SPBU")
      expect(extractMerchant(["APOTEK K-24 MALANG"])?.name).toBe("Apotek K-24")
    })

    it("suggests category for known merchants", () => {
      expect(extractMerchant(["INDOMARET"])?.category).toBe("Belanja")
      expect(extractMerchant(["STARBUCKS"])?.category).toBe("Makanan")
      expect(extractMerchant(["PERTAMINA"])?.category).toBe("Transportasi")
      expect(extractMerchant(["KIMIA FARMA"])?.category).toBe("Kesehatan")
    })

    it("falls back to plausible top line", () => {
      const res = extractMerchant(["WARUNG BU KRIS", "Jl. Merdeka No. 12", "Kasir: 01"])
      expect(res?.name).toBe("WARUNG BU KRIS")
    })
  })

  describe("extractDate", () => {
    it("extracts DD/MM/YYYY date", () => {
      expect(extractDate(["Tanggal: 25/09/2026", "Waktu: 14:30"])).toBe("2026-09-25")
      expect(extractDate(["25-09-2026"])).toBe("2026-09-25")
    })

    it("extracts YYYY-MM-DD date", () => {
      expect(extractDate(["Date: 2026-09-26 12:00"])).toBe("2026-09-26")
    })

    it("extracts DD Month YYYY text date", () => {
      expect(extractDate(["26 Sep 2026", "Jam: 10:15"])).toBe("2026-09-26")
      expect(extractDate(["26 September 2026"])).toBe("2026-09-26")
    })
  })

  describe("extractTotalAmount", () => {
    it("extracts amount from TOTAL lines", () => {
      const lines = [
        "INDOMARET",
        "1 CHITATO 20.000",
        "1 COCA COLA 10.000",
        "TOTAL : Rp 30.000",
        "TUNAI : 50.000",
        "KEMBALI : 20.000",
      ]
      expect(extractTotalAmount(lines)).toBe(30000)
    })

    it("handles GRAND TOTAL and multi-line total labels", () => {
      const lines = [
        "SUPERINDO",
        "SUBTOTAL : 150.000",
        "DISKON : 20.000",
        "GRAND TOTAL",
        "130.000",
        "CASH : 150.000",
      ]
      expect(extractTotalAmount(lines)).toBe(130000)
    })

    it("handles TOTAL BELANJA format from Alfamart", () => {
      const lines = [
        "ALFAMART",
        "ROTI TAWAR 15.000",
        "SUSU ULTRA 18.500",
        "TOTAL BELANJA : 33.500",
        "BAYAR (TUNAI) : 50.000",
      ]
      expect(extractTotalAmount(lines)).toBe(33500)
    })
  })

  describe("parseReceiptText", () => {
    it("parses full Indomaret receipt end-to-end", () => {
      const rawReceipt = `
        PT. INDOMARCO PRISMATAMA
        INDOMARET SUDIRMAN
        JL. SUDIRMAN NO. 45
        TGL 26-09-2026 18:45
        -----------------------------
        ULTRA MILK 250ML     7.500
        INDOMIE GORENG       3.500
        TANGO WAFER         12.000
        -----------------------------
        TOTAL BELANJA       23.000
        TUNAI               50.000
        KEMBALI             27.000
      `

      const parsed = parseReceiptText(rawReceipt)
      expect(parsed.merchant).toBe("Indomaret")
      expect(parsed.amount).toBe(23000)
      expect(parsed.date).toBe("2026-09-26")
      expect(parsed.suggestedCategory).toBe("Belanja")
      expect(parsed.confidence.amount).toBe(true)
      expect(parsed.confidence.merchant).toBe(true)
    })
  })
})

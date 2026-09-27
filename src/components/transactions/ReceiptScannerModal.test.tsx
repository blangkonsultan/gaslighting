import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ReceiptScannerModal } from "./ReceiptScannerModal"
import * as ocrModule from "@/lib/ocr"
import * as receiptParserModule from "@/lib/receipt-parser"

vi.mock("@/lib/ocr", () => ({
  recognizeReceiptText: vi.fn(),
  preprocessImage: vi.fn().mockResolvedValue("blob:test"),
}))

describe("ReceiptScannerModal", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.URL.createObjectURL = vi.fn().mockReturnValue("blob:test-preview")
  })

  it("renders idle view with camera and gallery buttons", () => {
    render(
      <ReceiptScannerModal
        open={true}
        onOpenChange={vi.fn()}
        onApplyReceipt={vi.fn()}
      />
    )

    expect(screen.getByText("Scan Struk Belanja")).toBeInTheDocument()
    expect(screen.getByText("Kamera HP")).toBeInTheDocument()
    expect(screen.getByText("Pilih Galeri")).toBeInTheDocument()
  })

  it("processes selected file and shows reviewed fields", async () => {
    vi.spyOn(ocrModule, "recognizeReceiptText").mockResolvedValue(
      "INDOMARET TOTAL : Rp 45.000 TGL 25/09/2026"
    )

    vi.spyOn(receiptParserModule, "parseReceiptText").mockReturnValue({
      merchant: "Indomaret",
      amount: 45000,
      date: "2026-09-25",
      suggestedCategory: "Belanja",
      rawText: "INDOMARET TOTAL : Rp 45.000",
      confidence: { amount: true, date: true, merchant: true },
    })

    const handleApply = vi.fn()
    render(
      <ReceiptScannerModal
        open={true}
        onOpenChange={vi.fn()}
        onApplyReceipt={handleApply}
      />
    )

    const fileInput = screen.getByTestId("file-upload-input") as HTMLInputElement
    const dummyFile = new File(["dummy content"], "receipt.jpg", { type: "image/jpeg" })

    fireEvent.change(fileInput, { target: { files: [dummyFile] } })

    await waitFor(() => {
      expect(screen.getByDisplayValue("Indomaret")).toBeInTheDocument()
      expect(screen.getByDisplayValue("45.000")).toBeInTheDocument()
      expect(screen.getByDisplayValue("2026-09-25")).toBeInTheDocument()
      expect(screen.getByText("Belanja")).toBeInTheDocument()
    })

    const applyBtn = screen.getByRole("button", { name: "Gunakan Data" })
    fireEvent.click(applyBtn)

    expect(handleApply).toHaveBeenCalledWith({
      amount: "45.000",
      description: "Indomaret",
      transaction_date: "2026-09-25",
      suggestedCategory: "Belanja",
      tags: ["#struk"],
    })
  })

  it("automatically processes initialFile when opened with one", async () => {
    vi.spyOn(ocrModule, "recognizeReceiptText").mockResolvedValue(
      "ALFAMART TOTAL 20.000 TGL 26/09/2026"
    )

    vi.spyOn(receiptParserModule, "parseReceiptText").mockReturnValue({
      merchant: "Alfamart",
      amount: 20000,
      date: "2026-09-26",
      suggestedCategory: "Belanja",
      rawText: "ALFAMART TOTAL 20.000",
      confidence: { amount: true, date: true, merchant: true },
    })

    const dummyFile = new File(["receipt image"], "shared-receipt.jpg", { type: "image/jpeg" })

    render(
      <ReceiptScannerModal
        open={true}
        initialFile={dummyFile}
        onOpenChange={vi.fn()}
        onApplyReceipt={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue("Alfamart")).toBeInTheDocument()
      expect(screen.getByDisplayValue("20.000")).toBeInTheDocument()
    })
  })
})

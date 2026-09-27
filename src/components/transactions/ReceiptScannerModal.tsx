import { useState, useRef, type ChangeEvent } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Camera, Image as ImageIcon, Check, RotateCcw, Sparkles } from "lucide-react"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { recognizeReceiptText } from "@/lib/ocr"
import { parseReceiptText, type ParsedReceipt } from "@/lib/receipt-parser"
import { formatIdrIntegerInput, parseIdrInteger } from "@/lib/money"
import { todayYmd } from "@/lib/dates"
import { toast } from "sonner"

export interface ReceiptScannerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onApplyReceipt: (data: {
    amount: string
    description: string
    transaction_date: string
    suggestedCategory?: string
    tags: string[]
  }) => void
}

type ScanStep = "idle" | "scanning" | "reviewed"

export function ReceiptScannerModal({
  open,
  onOpenChange,
  onApplyReceipt,
}: ReceiptScannerModalProps) {
  const [step, setStep] = useState<ScanStep>("idle")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [progressText, setProgressText] = useState("Mempersiapkan pemindaian…")
  const [progressPercent, setProgressPercent] = useState(0)

  // Review editable fields
  const [detectedMerchant, setDetectedMerchant] = useState("")
  const [detectedAmountStr, setDetectedAmountStr] = useState("")
  const [detectedDate, setDetectedDate] = useState("")
  const [detectedCategory, setDetectedCategory] = useState<string | null>(null)

  const cameraInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function resetState() {
    setStep("idle")
    setImagePreview(null)
    setProgressText("Mempersiapkan pemindaian…")
    setProgressPercent(0)
    setDetectedMerchant("")
    setDetectedAmountStr("")
    setDetectedDate("")
    setDetectedCategory(null)
  }

  async function processImageFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("File yang dipilih harus berupa gambar.")
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setImagePreview(previewUrl)
    setStep("scanning")
    setProgressPercent(10)
    setProgressText("Mempersiapkan OCR engine…")

    try {
      const rawText = await recognizeReceiptText(file, (p, status) => {
        setProgressPercent(p)
        setProgressText(status)
      })

      const parsed: ParsedReceipt = parseReceiptText(rawText)

      setDetectedMerchant(parsed.merchant || "Belanja Struk")
      setDetectedAmountStr(
        parsed.amount ? formatIdrIntegerInput(String(parsed.amount)) : ""
      )
      setDetectedDate(parsed.date || todayYmd())
      setDetectedCategory(parsed.suggestedCategory)

      setStep("reviewed")
      toast.success("Struk berhasil dipindai!")
    } catch (err) {
      console.error("Receipt OCR failed:", err)
      toast.error("Gagal memindai struk. Coba ambil foto dengan pencahayaan lebih terang.")
      setStep("idle")
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      void processImageFile(file)
    }
    e.target.value = ""
  }

  function handleApply() {
    const amountNum = parseIdrInteger(detectedAmountStr)
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      toast.error("Nominal total tidak valid.")
      return
    }

    onApplyReceipt({
      amount: detectedAmountStr,
      description: detectedMerchant.trim() || "Belanja Struk",
      transaction_date: detectedDate || todayYmd(),
      suggestedCategory: detectedCategory || undefined,
      tags: ["#struk"],
    })

    onOpenChange(false)
    resetState()
    toast.success("Data struk berhasil dimasukkan ke form!")
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen)
        if (!isOpen) resetState()
      }}
    >
      <DialogContent className="w-[95vw] sm:max-w-md max-h-[90dvh] flex flex-col p-0 overflow-hidden bg-background">
        <DialogHeader className="p-4 border-b border-border bg-card/40">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-primary/20 text-primary">
              <Camera size={18} />
            </span>
            <div>
              <DialogTitle className="text-base font-bold">
                Scan Struk Belanja
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Foto struk untuk mendeteksi nominal, tanggal, dan toko secara otomatis.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Hidden File Inputs */}
        <input
          ref={cameraInputRef}
          data-testid="camera-upload-input"
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          ref={fileInputRef}
          data-testid="file-upload-input"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex-1 overflow-y-auto p-4">
          {/* STEP 1: IDLE */}
          {step === "idle" && (
            <div className="flex flex-col items-center justify-center gap-4 py-6">
              <div className="w-16 h-16 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-primary">
                <Sparkles size={28} />
              </div>
              <div className="text-center max-w-xs space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Pindai Struk Otomatis
                </p>
                <p className="text-xs text-muted-foreground">
                  Gunakan kamera HP atau unggah foto struk belanja untuk mengisi formulir secara instan.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="touch-target flex flex-col h-auto py-4 gap-2 border-primary/30 hover:bg-primary/10"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera size={22} className="text-primary" />
                  <span className="text-xs font-semibold">Kamera HP</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="touch-target flex flex-col h-auto py-4 gap-2 border-border hover:bg-muted"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon size={22} className="text-muted-foreground" />
                  <span className="text-xs font-semibold">Pilih Galeri</span>
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: SCANNING */}
          {step === "scanning" && (
            <div className="flex flex-col items-center justify-center gap-5 py-6">
              {imagePreview && (
                <div className="relative w-36 h-48 rounded-lg overflow-hidden border border-border shadow-sm">
                  <img
                    src={imagePreview}
                    alt="Preview Struk"
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-primary/20 animate-pulse flex items-center justify-center">
                    <LoadingSpinner size={24} className="text-primary" />
                  </div>
                </div>
              )}

              <div className="w-full max-w-xs space-y-2 text-center">
                <p className="text-xs font-medium text-foreground">
                  {progressText} ({progressPercent}%)
                </p>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden border border-border">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEWED */}
          {step === "reviewed" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs">
                <Sparkles size={16} className="text-primary shrink-0" />
                <p className="text-foreground">
                  Data terdeteksi dari struk. Anda dapat menyesuaikannya sebelum menyimpan.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Nama Toko / Deskripsi
                  </Label>
                  <Input
                    value={detectedMerchant}
                    onChange={(e) => setDetectedMerchant(e.target.value)}
                    placeholder="Contoh: Indomaret"
                    className="touch-target text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Total Nominal (Rp)
                  </Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={detectedAmountStr}
                    onChange={(e) =>
                      setDetectedAmountStr(formatIdrIntegerInput(e.target.value))
                    }
                    placeholder="0"
                    className="touch-target text-sm tabular-nums text-right font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Tanggal Transaksi
                  </Label>
                  <Input
                    type="date"
                    max={todayYmd()}
                    value={detectedDate}
                    onChange={(e) => setDetectedDate(e.target.value)}
                    className="touch-target text-sm"
                  />
                </div>

                {detectedCategory && (
                  <div className="p-2.5 rounded-md bg-muted/40 border border-border flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Saran Kategori:</span>
                    <span className="font-semibold text-primary">
                      {detectedCategory}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === "reviewed" && (
          <DialogFooter className="px-5 pt-3.5 pb-6 sm:pb-4 border-t border-border bg-card/50 backdrop-blur-xs flex flex-row gap-3 shrink-0">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-11 text-xs sm:text-sm font-medium touch-target"
              onClick={resetState}
            >
              <RotateCcw size={15} className="mr-1.5" />
              Scan Ulang
            </Button>
            <Button
              type="button"
              className="flex-1 h-11 text-xs sm:text-sm font-semibold touch-target bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              onClick={handleApply}
            >
              <Check size={16} className="mr-1.5" />
              Gunakan Data
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

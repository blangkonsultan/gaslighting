import { AlertTriangle, Check, X, ArrowUp, ArrowDown } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AmountDisplay } from "@/components/shared/AmountDisplay"
import { formatCurrency } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import type { BalanceRecalcPreview, BalanceRecalcSummary } from "@/types/financial"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  preview: BalanceRecalcPreview[]
  summary: BalanceRecalcSummary
  isApplying: boolean
  onApply: () => void
}

export function BalanceRecalculationDialog({
  open,
  onOpenChange,
  preview,
  summary,
  isApplying,
  onApply,
}: Props) {
  function handleApply() {
    onApply()
  }

  if (preview.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tidak Ada Rekening</DialogTitle>
            <DialogDescription>
              Kamu belum memiliki rekening aktif. Buat rekening terlebih dahulu.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} className="touch-target">
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  const accountsWithChanges = preview.filter((p) => p.needsUpdate)
  const accountsWithNoChange = preview.filter((p) => !p.needsUpdate)
  const accountsWithNegative = preview.filter((p) => p.wouldBeNegative && p.needsUpdate)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Hitung Ulang Saldo</DialogTitle>
          <DialogDescription>
            Periksa dan koreksi saldo rekening berdasarkan riwayat transaksi.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 overflow-y-auto py-2">
          {summary.updateCount > 0 && (
            <div className="flex flex-col gap-3 rounded-lg bg-blue-50 p-4 dark:bg-blue-950/30">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-blue-900 dark:text-blue-200">
                  {summary.updateCount} rekening akan diperbarui
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-blue-800 dark:text-blue-300">
                <div>Selisih total: {formatCurrency(summary.totalDifference)}</div>
                <div>{summary.skipCount} rekening dilewati (saldo negatif)</div>
              </div>
            </div>
          )}

          {summary.hasIssues && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-medium">Beberapa rekening dilewati</p>
                <p className="mt-1">
                  Rekening dengan saldo negatif tidak akan diperbarui. Periksa ulang transaksi
                  untuk rekening tersebut.
                </p>
              </div>
            </div>
          )}

          {accountsWithNegative.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-amber-700 dark:text-amber-400">
                Dilewati (Saldo Negatif)
              </h3>
              <div className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/20">
                {accountsWithNegative.map((p) => (
                  <div
                    key={p.accountId}
                    className="flex items-start justify-between gap-4 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="font-medium">{p.accountName}</div>
                      <div className="text-xs text-amber-700 dark:text-amber-400">
                        Saldo dihitung: {formatCurrency(p.calculatedBalance)}
                      </div>
                    </div>
                    <X className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {accountsWithChanges.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium">
                Perubahan yang Akan Diterapkan
              </h3>
              <div className="flex flex-col gap-2 rounded-lg border bg-card">
                {accountsWithChanges
                  .filter((p) => !p.wouldBeNegative)
                  .map((p) => {
                    const difference = p.calculatedBalance - p.currentBalance
                    const isIncrease = difference > 0
                    return (
                      <div
                        key={p.accountId}
                        className="flex items-start justify-between gap-4 border-b border-border p-3 last:border-0"
                      >
                        <div className="min-w-0">
                          <div className="font-medium">{p.accountName}</div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Sekarang: {formatCurrency(p.currentBalance)}</span>
                            <span>→</span>
                            <span className="text-foreground">
                              Menjadi: {formatCurrency(p.calculatedBalance)}
                            </span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1 text-sm">
                          {isIncrease ? (
                            <ArrowUp className="h-4 w-4 text-green-600 dark:text-green-500" />
                          ) : (
                            <ArrowDown className="h-4 w-4 text-red-600 dark:text-red-500" />
                          )}
                          <AmountDisplay
                            amount={difference}
                            showSign
                            className={cn(
                              isIncrease ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"
                            )}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {accountsWithNoChange.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {accountsWithNoChange.length} rekening tidak memerlukan perubahan
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isApplying}
            className="touch-target"
          >
            Batal
          </Button>
          <Button
            onClick={handleApply}
            disabled={isApplying || summary.updateCount === 0}
            className="touch-target"
          >
            {isApplying ? "Menerapkan…" : "Terapkan Perubahan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

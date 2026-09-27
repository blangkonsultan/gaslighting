import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { PrintableReport } from "./PrintableReport"
import type { MonthlyReport } from "@/lib/reports/monthly"
import type { TransactionListRow } from "@/services/transactions.service"

export interface PrintPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  monthLabel: string
  report: MonthlyReport | null
  transactions: TransactionListRow[]
  userName?: string
}

export function PrintPreviewDialog({
  open,
  onOpenChange,
  monthLabel,
  report,
  transactions,
  userName = "Pengguna",
}: PrintPreviewDialogProps) {
  function handlePrint() {
    if (typeof window !== "undefined") {
      window.print()
    }
  }

  if (!report) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-4xl lg:max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-background">
        <DialogHeader className="px-5 py-3.5 border-b border-border bg-card/50 flex flex-row items-center justify-between no-print gap-3">
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-sm font-semibold tracking-tight text-foreground truncate">
              Pratinjau Laporan Keuangan
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground truncate">
              Periode {monthLabel} • {transactions.length} transaksi
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2 pr-6 shrink-0">
            <Button
              size="sm"
              className="touch-target text-xs sm:text-sm font-medium"
              onClick={handlePrint}
            >
              <Printer size={15} className="mr-1.5" />
              <span>Cetak / Simpan PDF</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="overflow-x-auto overflow-y-auto flex-1 p-3 sm:p-6 bg-neutral-100/60">
          <div className="min-w-[620px] max-w-4xl shadow-md border border-neutral-200 rounded-lg overflow-hidden bg-white mx-auto print:min-w-0 print:border-none print:shadow-none print:m-0">
            <PrintableReport
              monthLabel={monthLabel}
              report={report}
              transactions={transactions}
              userName={userName}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

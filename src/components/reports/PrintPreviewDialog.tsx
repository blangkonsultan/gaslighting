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
      <DialogContent className="no-print w-[95vw] sm:max-w-2xl md:max-w-3xl top-[calc(env(safe-area-inset-top,0px)+0.5rem)] translate-y-0 sm:top-1/2 sm:-translate-y-1/2 max-h-[calc(100dvh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)-1rem)] sm:max-h-[88dvh] flex flex-col p-0 overflow-hidden bg-background shadow-xl">
        <DialogHeader className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10 flex flex-row items-center justify-between no-print gap-2">
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-sm font-semibold tracking-tight text-foreground truncate">
              Pratinjau Laporan Keuangan
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground truncate">
              Periode {monthLabel} • {transactions.length} mutasi
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

        <div className="overflow-y-auto flex-1 p-2 sm:p-4 bg-muted/20">
          <div className="w-full shadow-sm rounded-lg overflow-hidden bg-white mx-auto print:shadow-none print:m-0">
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

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
        <DialogHeader className="p-4 border-b border-border bg-card/60 flex flex-row items-center justify-between no-print gap-2">
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-base font-bold truncate">
              Pratinjau Laporan Keuangan
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground truncate">
              Periode {monthLabel} • {transactions.length} transaksi
            </DialogDescription>
            <p className="text-[10px] text-muted-foreground sm:hidden mt-0.5">
              💡 Geser tabel ke samping untuk melihat rincian lengkap
            </p>
          </div>
          <div className="flex items-center gap-2 pr-6 shrink-0">
            <Button
              size="sm"
              className="touch-target bg-primary text-primary-foreground hover:bg-primary/90 text-xs sm:text-sm"
              onClick={handlePrint}
            >
              <Printer size={16} className="mr-1.5" />
              <span>Cetak / Simpan PDF</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="overflow-x-auto overflow-y-auto flex-1 p-2 sm:p-4 bg-muted/20">
          <div className="min-w-[660px] shadow-sm border border-slate-200 rounded-lg overflow-hidden bg-white mx-auto print:min-w-0 print:border-none print:shadow-none print:m-0">
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

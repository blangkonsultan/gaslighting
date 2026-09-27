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
        <DialogHeader className="p-4 border-b border-border bg-card/60 flex flex-row items-center justify-between no-print">
          <div>
            <DialogTitle className="text-base font-bold">
              Pratinjau Laporan Keuangan
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Periode {monthLabel} • {transactions.length} transaksi
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2 pr-6">
            <Button
              size="sm"
              className="touch-target bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handlePrint}
            >
              <Printer size={16} className="mr-2" />
              Cetak / Simpan PDF
            </Button>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 p-4 bg-muted/20">
          <div className="shadow-sm border border-slate-200 rounded-lg overflow-hidden bg-white">
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

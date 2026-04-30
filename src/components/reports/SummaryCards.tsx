import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { AmountDisplay } from "@/components/shared/AmountDisplay"
import { formatCurrency, formatPercentage } from "@/lib/formatters"
import type { MonthlyReport } from "@/lib/reports/monthly"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SummaryCardsProps {
  report: MonthlyReport
}

export function SummaryCards({ report }: SummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" />
            Pemasukan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tabular-nums">{formatCurrency(report.incomeTotal)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingDown size={16} className="text-destructive" />
            Pengeluaran
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tabular-nums">{formatCurrency(report.expenseTotal)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Bersih</CardTitle>
        </CardHeader>
        <CardContent>
          <AmountDisplay
            amount={report.netTotal}
            showSign
            className={cn("text-2xl font-bold tabular-nums", report.netTotal >= 0 ? "text-primary" : "text-destructive")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Rasio Tabungan</CardTitle>
        </CardHeader>
        <CardContent>
          <p
            className={cn(
              "text-2xl font-bold tabular-nums",
              report.savingsRate >= 20 ? "text-primary" : report.savingsRate < 0 ? "text-destructive" : ""
            )}
          >
            {formatPercentage(report.savingsRate)}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

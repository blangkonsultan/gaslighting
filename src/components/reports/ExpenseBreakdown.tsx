import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { CategoryPieChart } from "@/components/charts/CategoryPieChart"
import type { CategoryBreakdown } from "@/lib/reports/monthly"
import { formatCurrency } from "@/lib/formatters"

interface ExpenseBreakdownProps {
  categories: CategoryBreakdown[]
}

export function ExpenseBreakdown({ categories }: ExpenseBreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Pengeluaran per Kategori</CardTitle>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada pengeluaran bulan ini.</p>
        ) : (
          <div className="flex flex-col gap-4">
            <CategoryPieChart data={categories} />
            <div className="flex flex-col gap-3">
              {categories.map((c) => (
                <div key={c.name} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate font-medium">{c.name}</p>
                      <p className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {Math.round(c.percentage)}%
                      </p>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${c.percentage}%` }} />
                    </div>
                  </div>
                  <p className="shrink-0 text-sm font-medium tabular-nums">{formatCurrency(c.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

import { EmptyState } from "@/components/shared/EmptyState"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AmountDisplay } from "@/components/shared/AmountDisplay"
import { useAuthStore } from "@/stores/auth-store"
import { queryKeys } from "@/lib/query-client"
import { useQuery } from "@tanstack/react-query"
import { getTransactions } from "@/services/transactions.service"
import { computeMonthlyReport, monthRangeYmdFromMonthKey } from "@/lib/reports/monthly"
import { formatCurrency } from "@/lib/formatters"
import { cn } from "@/lib/utils"

export default function ReportsPage() {
  const { profile } = useAuthStore()
  const userId = profile?.id

  const monthKey = new Date().toISOString().slice(0, 7) // YYYY-MM
  const { start, end } = monthRangeYmdFromMonthKey(monthKey)

  const txQuery = useQuery({
    queryKey: queryKeys.reports.monthly(monthKey),
    queryFn: async () =>
      getTransactions(userId as string, {
        dateFrom: start,
        dateTo: end,
      }),
    enabled: Boolean(userId),
  })

  const report = txQuery.data ? computeMonthlyReport(txQuery.data) : null

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Laporan</h1>

      {!userId ? (
        <EmptyState
          title="Sesi login tidak ditemukan"
          description="Silakan login ulang untuk melihat laporan."
        />
      ) : txQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Memuat…</p>
      ) : txQuery.isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          Gagal memuat laporan.
        </div>
      ) : (txQuery.data?.length ?? 0) === 0 || !report ? (
        <EmptyState
          title="Belum ada data laporan"
          description="Mulai catat transaksi untuk melihat laporan keuanganmu"
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pemasukan</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tabular-nums">{formatCurrency(report.incomeTotal)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pengeluaran</CardTitle>
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
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pengeluaran per Kategori</CardTitle>
            </CardHeader>
            <CardContent>
              {report.expenseByCategory.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada pengeluaran bulan ini.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {report.expenseByCategory.map((c) => (
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
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

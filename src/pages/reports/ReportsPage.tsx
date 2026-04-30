import { useEffect, useState } from "react"
import { useQueryClient, useQuery } from "@tanstack/react-query"
import { EmptyState } from "@/components/shared/EmptyState"
import { useAuthStore } from "@/stores/auth-store"
import { queryKeys } from "@/lib/query-client"
import { getTransactions } from "@/services/transactions.service"
import { computeMonthlyReport, computeTrendData, monthRangeYmdFromMonthKey, type MonthlyTrendPoint } from "@/lib/reports/monthly"
import { PeriodSelector } from "@/components/reports/PeriodSelector"
import { SummaryCards } from "@/components/reports/SummaryCards"
import { ExpenseBreakdown } from "@/components/reports/ExpenseBreakdown"
import { IncomeBreakdown } from "@/components/reports/IncomeBreakdown"
import { TrendSection } from "@/components/reports/TrendSection"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { addMonthsYmd, todayYmd } from "@/lib/dates"
import { getEarliestTransactionDate } from "@/services/transactions.service"

const currentMonthKey = todayYmd().slice(0, 7)

export default function ReportsPage() {
  const { profile } = useAuthStore()
  const userId = profile?.id
  const queryClient = useQueryClient()

  const [monthKey, setMonthKey] = useState(currentMonthKey)

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

  const trendQuery = useQuery({
    queryKey: queryKeys.reports.trend(monthKey, 12),
    queryFn: async () => {
      const year = monthKey.split("-")[0]
      const monthKeys = Array.from({ length: 12 }, (_, i) =>
        `${year}-${String(i + 1).padStart(2, "0")}`
      )
      const txs = await getTransactions(userId as string, {
        dateFrom: `${year}-01-01`,
        dateTo: `${year}-12-31`,
      })
      return computeTrendData(txs, monthKeys)
    },
    enabled: Boolean(userId),
  })

  const earliestQuery = useQuery({
    queryKey: queryKeys.reports.earliest,
    queryFn: () => getEarliestTransactionDate(userId as string),
    enabled: Boolean(userId),
  })

  const minMonthKey = earliestQuery.data
    ? earliestQuery.data.slice(0, 7)
    : null

  const trendData: MonthlyTrendPoint[] | undefined = trendQuery.data

  useEffect(() => {
    if (!userId) return
    const prev = addMonthsYmd(monthKey, -1)
    const next = addMonthsYmd(monthKey, 1)
    const fetchAdjacent = async (mk: string) => {
      const { start: s, end: e } = monthRangeYmdFromMonthKey(mk)
      queryClient.prefetchQuery({
        queryKey: queryKeys.reports.monthly(mk),
        queryFn: () => getTransactions(userId, { dateFrom: s, dateTo: e }),
      })
    }
    fetchAdjacent(prev)
    if (next <= currentMonthKey) fetchAdjacent(next)
  }, [monthKey, userId, queryClient])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Laporan</h1>
      </div>

      <PeriodSelector monthKey={monthKey} onMonthChange={setMonthKey} minMonthKey={minMonthKey} />

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
          <SummaryCards report={report} />

          <Tabs defaultValue="expense">
            <TabsList className="w-full">
              <TabsTrigger value="expense" className="flex-1">Pengeluaran</TabsTrigger>
              <TabsTrigger value="income" className="flex-1">Pemasukan</TabsTrigger>
              <TabsTrigger value="trend" className="flex-1">Tren</TabsTrigger>
            </TabsList>
            <TabsContent value="expense">
              <ExpenseBreakdown categories={report.expenseByCategory} />
            </TabsContent>
            <TabsContent value="income">
              <IncomeBreakdown categories={report.incomeByCategory} />
            </TabsContent>
            <TabsContent value="trend">
              <TrendSection data={trendData ?? []} isLoading={trendQuery.isLoading} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}

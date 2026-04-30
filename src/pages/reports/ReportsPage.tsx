import { useState } from "react"
import { EmptyState } from "@/components/shared/EmptyState"
import { useQuery } from "@tanstack/react-query"
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
import { addMonthsYmd } from "@/lib/dates"

const currentMonthKey = new Date().toISOString().slice(0, 7)

export default function ReportsPage() {
  const { profile } = useAuthStore()
  const userId = profile?.id

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
    queryKey: queryKeys.reports.trend(monthKey, 6),
    queryFn: async () => {
      const monthKeys: string[] = []
      let tempMonth = addMonthsYmd(monthKey, -5)
      for (let i = 0; i < 6; i++) {
        monthKeys.push(tempMonth)
        tempMonth = addMonthsYmd(tempMonth, 1)
      }
      const firstMonth = monthKeys[0]
      const firstRange = monthRangeYmdFromMonthKey(firstMonth)
      const txs = await getTransactions(userId as string, { dateFrom: firstRange.start, dateTo: end })
      return computeTrendData(txs, monthKeys)
    },
    enabled: Boolean(userId),
  })

  const trendData: MonthlyTrendPoint[] | undefined = trendQuery.data

  const hasRecords = (targetMonth: string): boolean => {
    if (targetMonth === monthKey) {
      return (txQuery.data?.length ?? 0) > 0
    }
    if (!trendData) return false
    const record = trendData.find((d) => d.monthKey === targetMonth)
    return (record?.income ?? 0) > 0 || (record?.expense ?? 0) > 0
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Laporan</h1>
      </div>

      <PeriodSelector monthKey={monthKey} onMonthChange={setMonthKey} hasRecords={hasRecords} />

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

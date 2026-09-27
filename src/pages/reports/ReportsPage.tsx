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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Download, FileSpreadsheet, Printer } from "lucide-react"
import { toast } from "sonner"
import { generateTransactionsCsv, downloadCsvFile } from "@/lib/reports/export-csv"
import { PrintPreviewDialog } from "@/components/reports/PrintPreviewDialog"
import { PrintableReport } from "@/components/reports/PrintableReport"
import { addMonthsYmd, todayYmd } from "@/lib/dates"
import { getEarliestTransactionDate } from "@/services/transactions.service"
const currentMonthKey = todayYmd().slice(0, 7)

function formatMonthKeyLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number)
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(
    new Date(year, month - 1, 1)
  )
}
export default function ReportsPage() {
  const { profile } = useAuthStore()
  const userId = profile?.id
  const queryClient = useQueryClient()

  const [monthKey, setMonthKey] = useState(currentMonthKey)
  const [showPrintPreview, setShowPrintPreview] = useState(false)
  const monthLabel = formatMonthKeyLabel(monthKey)
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

  const year = monthKey.split("-")[0]

  const trendQuery = useQuery({
    queryKey: queryKeys.reports.trend(year, 12),
    queryFn: async () => {
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
    if (!minMonthKey || prev >= minMonthKey) fetchAdjacent(prev)
    if (next <= currentMonthKey) fetchAdjacent(next)
  }, [monthKey, userId, queryClient, minMonthKey])

  function handleExportCsv() {
    if (!txQuery.data || txQuery.data.length === 0) {
      toast.error("Tidak ada transaksi untuk diekspor pada periode ini.")
      return
    }
    const csv = generateTransactionsCsv(txQuery.data, {
      monthKey,
      includeSummary: true,
    })
    const filename = `gaslighting-laporan-${monthKey}.csv`
    downloadCsvFile(filename, csv)
    toast.success("Laporan CSV berhasil diunduh!")
  }
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between no-print">
        <h1 className="text-2xl font-bold">Laporan</h1>

        {report && (
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card/80 px-3 py-1.5 text-sm font-medium hover:bg-card transition-colors touch-target"
              aria-label="Menu Ekspor Laporan"
            >
              <Download size={16} />
              <span>Ekspor</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={6} className="w-48">
              <DropdownMenuItem
                className="cursor-pointer text-xs"
                onClick={handleExportCsv}
              >
                <FileSpreadsheet size={15} className="mr-2 text-emerald-600" />
                Unduh CSV (.csv)
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-xs"
                onClick={() => setShowPrintPreview(true)}
              >
                <Printer size={15} className="mr-2 text-primary" />
                Cetak / Simpan PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
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

      <PrintPreviewDialog
        open={showPrintPreview}
        onOpenChange={setShowPrintPreview}
        monthLabel={monthLabel}
        report={report}
        transactions={txQuery.data ?? []}
        userName={profile?.full_name || profile?.email || "Pengguna"}
      />

      {report && (
        <div className="print-only">
          <PrintableReport
            monthLabel={monthLabel}
            report={report}
            transactions={txQuery.data ?? []}
            userName={profile?.full_name || profile?.email || "Pengguna"}
          />
        </div>
      )}
    </div>
  )
}

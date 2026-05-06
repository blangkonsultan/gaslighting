import { useAuthStore } from "@/stores/auth-store"
import { queryKeys } from "@/lib/query-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/EmptyState"
import { BalanceWarningBanner } from "@/components/shared/BalanceWarningBanner"
import { Wallet, TrendingUp, TrendingDown } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { getDashboardSummary, getRecentTransactions } from "@/services/dashboard.service"
import { useBalanceIssuesWarning } from "@/hooks/useBalanceIssuesWarning"
import { formatCurrency, formatShortDate } from "@/lib/formatters"
import { AmountDisplay } from "@/components/shared/AmountDisplay"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const { profile } = useAuthStore()
  const userId = profile?.id

  const summaryQuery = useQuery({
    queryKey: [...queryKeys.dashboard.summary, userId],
    queryFn: () => getDashboardSummary(userId as string),
    enabled: Boolean(userId),
    staleTime: 30_000,
  })

  const recentTxQuery = useQuery({
    queryKey: [...queryKeys.dashboard.recent, userId],
    queryFn: () => getRecentTransactions(userId as string, 5),
    enabled: Boolean(userId),
    staleTime: 30_000,
  })

  const { showWarning, handleDismissWarning } = useBalanceIssuesWarning(userId)

  const totalBalanceText = summaryQuery.data
    ? formatCurrency(summaryQuery.data.totalBalance)
    : summaryQuery.isLoading
      ? "Memuat…"
      : "-"

  const incomeText = summaryQuery.data
    ? formatCurrency(summaryQuery.data.monthlyIncome)
    : summaryQuery.isLoading
      ? "Memuat…"
      : "-"

  const expenseText = summaryQuery.data
    ? formatCurrency(summaryQuery.data.monthlyExpense)
    : summaryQuery.isLoading
      ? "Memuat…"
      : "-"

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">
          Halo, {profile?.full_name?.split(" ")[0] || "User"}!
        </h1>
        <p className="text-sm text-muted-foreground">Ringkasan keuanganmu hari ini</p>
      </div>

      {showWarning && (
        <BalanceWarningBanner
          message="Beberapa rekening memiliki saldo yang tidak konsisten. Periksa tab Rekening untuk detail."
          actionLabel="Lihat Rekening"
          onActionClick={() => (window.location.href = "/accounts")}
          onDismiss={handleDismissWarning}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Saldo</CardTitle>
            <Wallet size={18} className="text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{totalBalanceText}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pemasukan Bulan Ini</CardTitle>
            <TrendingUp size={18} className="text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{incomeText}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pengeluaran Bulan Ini</CardTitle>
            <TrendingDown size={18} className="text-destructive" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{expenseText}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transaksi Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTxQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Memuat…</p>
          ) : recentTxQuery.isError ? (
            <p className="text-sm text-destructive">
              Gagal memuat transaksi.
            </p>
          ) : (recentTxQuery.data?.length ?? 0) === 0 ? (
            <EmptyState
              title="Belum ada transaksi"
              description="Mulai tambahkan pemasukan atau pengeluaran pertamamu"
            />
          ) : (
            <div className="divide-y divide-border rounded-lg border border-border bg-background/40">
              {recentTxQuery.data!.map((t) => {
                const isTransferOut = t.type === "transfer" && (t.description ?? "").toLowerCase().includes("transfer keluar")
                const isTransferIn = t.type === "transfer" && (t.description ?? "").toLowerCase().includes("transfer masuk")
                const amountSigned = isTransferOut
                  ? -t.amount
                  : t.type === "expense"
                    ? -t.amount
                    : t.amount
                return (
                  <div key={t.id} className="flex items-start justify-between gap-4 p-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {t.description || (t.categories?.name ?? "Transaksi")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatShortDate(t.transaction_date)} • {t.accounts?.name ?? "Rekening"}
                      </p>
                    </div>
                    <AmountDisplay
                      amount={amountSigned}
                      showSign
                      className={cn("shrink-0 text-sm", (t.type === "income" || isTransferIn) && "text-primary")}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

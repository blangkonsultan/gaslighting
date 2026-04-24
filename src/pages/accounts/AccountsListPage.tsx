import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"

import { EmptyState } from "@/components/shared/EmptyState"
import { PageLoading } from "@/components/shared/LoadingSpinner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/formatters"
import { queryKeys } from "@/lib/query-client"
import { getAccounts } from "@/services/accounts.service"
import { useAuthStore } from "@/stores/auth-store"
import type { Account } from "@/types/financial"

export default function AccountsListPage() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()

  const {
    data: accounts,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.accounts.all,
    queryFn: async () => {
      if (!profile?.id) return [] as Account[]
      return getAccounts(profile.id)
    },
    enabled: !!profile?.id,
  })

  if (isLoading) return <PageLoading />

  const hasAccounts = (accounts?.length ?? 0) > 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Rekening</h1>
        <Button onClick={() => navigate("/accounts/new")} className="touch-target">
          + Tambah
        </Button>
      </div>

      {isError ? (
        <EmptyState
          title="Gagal memuat rekening"
          description="Coba refresh halaman. Jika masih gagal, pastikan kamu sudah login dan aturan akses database (RLS) mengizinkan data dibaca."
          action={
            <Button onClick={() => window.location.reload()} className="touch-target">
              Refresh
            </Button>
          }
        />
      ) : !hasAccounts ? (
        <EmptyState
          title="Belum ada rekening"
          description="Tambahkan rekening bank, e-wallet, atau dompet cash"
          action={
            <Button onClick={() => navigate("/accounts/new")} className="touch-target">
              Tambah Rekening
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {accounts!.map((acc) => (
            <AccountCard key={acc.id} account={acc} />
          ))}
        </div>
      )}
    </div>
  )
}

const typeLabels: Record<string, string> = {
  bank: "Bank",
  ewallet: "E-Wallet",
  cash: "Tunai",
  savings: "Tabungan",
  investment: "Investasi",
  other: "Lainnya",
}

function AccountCard({ account }: { account: Account }) {
  return (
    <Card className="transition-colors hover:bg-muted/20">
      <CardHeader className="gap-2">
        <CardTitle className="flex items-start justify-between gap-3">
          <span className="min-w-0 truncate">{account.name}</span>
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {typeLabels[account.type] || account.type}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-baseline justify-between gap-2">
        <span className="text-xs text-muted-foreground">Saldo</span>
        <span className="font-semibold tabular-nums">{formatCurrency(account.balance ?? 0)}</span>
      </CardContent>
    </Card>
  )
}

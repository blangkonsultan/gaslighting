import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"
import { AmountDisplay } from "@/components/shared/AmountDisplay"
import { useAuthStore } from "@/stores/auth-store"
import { queryKeys } from "@/lib/query-client"
import { getTransactions } from "@/services/transactions.service"
import { formatShortDate } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { Pencil } from "lucide-react"

export default function TransactionListPage() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const userId = profile?.id

  const txQuery = useQuery({
    queryKey: queryKeys.transactions.filtered({ userId }),
    queryFn: async () => getTransactions(userId as string),
    enabled: Boolean(userId),
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transaksi</h1>
        <Button onClick={() => navigate("/transactions/new")} className="touch-target">
          + Tambah
        </Button>
      </div>

      {!userId ? (
        <EmptyState
          title="Sesi login tidak ditemukan"
          description="Silakan login ulang untuk melihat transaksi."
          action={
            <Button onClick={() => navigate("/auth/login")} className="touch-target">
              Login
            </Button>
          }
        />
      ) : txQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Memuat…</p>
      ) : txQuery.isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          Gagal memuat transaksi.
        </div>
      ) : (txQuery.data?.length ?? 0) === 0 ? (
        <EmptyState
          title="Belum ada transaksi"
          description="Catat pemasukan atau pengeluaran pertamamu"
          action={
            <Button onClick={() => navigate("/transactions/new")} className="touch-target">
              Tambah Transaksi
            </Button>
          }
        />
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border bg-background/40">
          {txQuery.data!.map((t) => {
            const isTransfer = t.type === "transfer"
            const isTransferOut = isTransfer && (t.description ?? "").toLowerCase().includes("transfer keluar")
            const isTransferIn = isTransfer && (t.description ?? "").toLowerCase().includes("transfer masuk")

            const amountSigned = isTransfer ? (isTransferOut ? -t.amount : t.amount) : t.type === "expense" ? -t.amount : t.amount
            const canEdit = true
            return (
              <button
                key={t.id}
                type="button"
                className={cn(
                  "flex w-full items-start justify-between gap-4 p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  canEdit ? "hover:bg-muted/40" : "cursor-default"
                )}
                onClick={() => {
                  if (!canEdit) return
                  navigate(`/transactions/${t.id}/edit`)
                }}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{t.description || (t.categories?.name ?? "Transaksi")}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatShortDate(t.transaction_date)} • {t.accounts?.name ?? "Rekening"}
                  </p>
                  {isTransfer && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {isTransferOut ? "Transfer keluar" : isTransferIn ? "Transfer masuk" : "Transfer"}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <AmountDisplay
                    amount={amountSigned}
                    showSign
                    className={cn("shrink-0 text-sm", (t.type === "income" || (isTransfer && !isTransferOut)) && "text-primary")}
                  />
                  <span className="inline-flex size-8 items-center justify-center rounded-md border border-border bg-background/50 text-muted-foreground">
                    <Pencil size={16} aria-hidden="true" />
                    <span className="sr-only">Edit</span>
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

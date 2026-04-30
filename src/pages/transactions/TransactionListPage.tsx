import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"
import { AmountDisplay } from "@/components/shared/AmountDisplay"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuthStore } from "@/stores/auth-store"
import { useTransactionFilters } from "@/stores/transaction-filters"
import { queryKeys } from "@/lib/query-client"
import { getTransactionsPage, TRANSACTIONS_PAGE_SIZE_DEFAULT } from "@/services/transactions.service"
import { getAccounts } from "@/services/accounts.service"
import { getCategories } from "@/services/admin.service"
import { formatShortDate } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Pencil } from "lucide-react"

const PAGE_SIZE = TRANSACTIONS_PAGE_SIZE_DEFAULT

export default function TransactionListPage() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const userId = profile?.id
  const { filters, setFilters, resetFilters } = useTransactionFilters()

  const [searchInput, setSearchInput] = useState(filters.search ?? "")

  const { data: accounts } = useQuery({
    queryKey: queryKeys.accounts.all,
    queryFn: () => getAccounts(userId as string),
    enabled: Boolean(userId),
  })

  const { data: categories } = useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: getCategories,
    staleTime: 5 * 60 * 1000,
  })

  const accountLabelById = useMemo(() => new Map((accounts ?? []).map((a) => [a.id, a.name])), [accounts])
  const categoryLabelById = useMemo(() => new Map((categories ?? []).map((c) => [c.id, c.name])), [categories])

  const hasActiveFilters = Boolean(filters.search?.trim() || filters.categoryId || filters.accountId)

  useEffect(() => {
    setSearchInput(filters.search ?? "")
  }, [filters.search])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const trimmed = searchInput.trim()
      setFilters({ search: trimmed ? trimmed : undefined })
    }, 300)

    return () => window.clearTimeout(handle)
  }, [searchInput, setFilters])

  const queryFilters = useMemo(() => ({ ...filters, userId }), [filters, userId])

  const txQuery = useInfiniteQuery({
    queryKey: queryKeys.transactions.filtered(queryFilters),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) =>
      getTransactionsPage({
        userId: userId as string,
        filters,
        pageIndex: pageParam,
        pageSize: PAGE_SIZE,
      }),
    getNextPageParam: (lastPage, allPages) => (lastPage.length < PAGE_SIZE ? undefined : allPages.length),
    enabled: Boolean(userId),
  })

  const rows = txQuery.data?.pages.flat() ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transaksi</h1>
        <Button onClick={() => navigate("/transactions/new")} className="touch-target">
          + Tambah
        </Button>
      </div>

      {!!userId && (
        <div className="flex flex-col gap-2">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari deskripsi…"
            aria-label="Cari transaksi berdasarkan deskripsi"
          />
          <div className="grid grid-cols-2 gap-2">
            <Select value={filters.categoryId ?? ""} onValueChange={(v) => setFilters({ categoryId: v || undefined })}>
              <SelectTrigger size="sm" className="touch-target w-full">
                <SelectValue>
                  {(v) => {
                    if (!v) return "Semua kategori"
                    return categoryLabelById.get(v) ?? v
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(["expense", "income"] as const).map((type) => {
                  const group = (categories ?? []).filter((c) => c.type === type)
                  if (group.length === 0) return null
                  return (
                    <SelectGroup key={type}>
                      <SelectLabel>{type === "income" ? "Pemasukan" : "Pengeluaran"}</SelectLabel>
                      {group.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )
                })}
              </SelectContent>
            </Select>

            <Select value={filters.accountId ?? ""} onValueChange={(v) => setFilters({ accountId: v || undefined })}>
              <SelectTrigger size="sm" className="touch-target w-full">
                <SelectValue>
                  {(v) => {
                    if (!v) return "Semua rekening"
                    return accountLabelById.get(v) ?? v
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {(accounts ?? []).map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="touch-target self-start"
              onClick={() => {
                setSearchInput("")
                resetFilters()
              }}
            >
              Reset filter
            </Button>
          )}
        </div>
      )}

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
      ) : rows.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? "Tidak ada hasil" : "Belum ada transaksi"}
          description={
            hasActiveFilters
              ? "Coba ubah filter untuk menemukan transaksi."
              : "Catat pemasukan atau pengeluaran pertamamu"
          }
          action={
            <Button onClick={() => navigate("/transactions/new")} className="touch-target">
              Tambah Transaksi
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          <div className="divide-y divide-border rounded-lg border border-border bg-background/40">
            {rows.map((t) => {
              const isTransfer = t.type === "transfer"
              const isTransferOut = isTransfer && (t.description ?? "").toLowerCase().includes("transfer keluar")
              const isTransferIn = isTransfer && (t.description ?? "").toLowerCase().includes("transfer masuk")

              const amountSigned = isTransfer
                ? isTransferOut
                  ? -t.amount
                  : t.amount
                : t.type === "expense"
                  ? -t.amount
                  : t.amount
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
                      className={cn(
                        "shrink-0 text-sm",
                        (t.type === "income" || (isTransfer && !isTransferOut)) && "text-primary"
                      )}
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

          {txQuery.hasNextPage && (
            <div className="flex justify-center">
              <Button
                type="button"
                className="touch-target"
                onClick={() => txQuery.fetchNextPage()}
                disabled={txQuery.isFetchingNextPage}
              >
                {txQuery.isFetchingNextPage ? "Memuat…" : "Tampilkan lagi"}
              </Button>
            </div>
          )}

          {txQuery.isFetching && !txQuery.isFetchingNextPage && (
            <p className="text-center text-xs text-muted-foreground">Memperbarui…</p>
          )}
        </div>
      )}
    </div>
  )
}

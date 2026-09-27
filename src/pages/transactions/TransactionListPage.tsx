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
import { Pencil, SlidersHorizontal, X } from "lucide-react"
import { TransactionFilterSheet } from "@/components/transactions/TransactionFilterSheet"
import { getUserTags } from "@/services/transactions.service"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/formatters"
import { formatTransactionType } from "@/lib/reports/export-csv"

const PAGE_SIZE = TRANSACTIONS_PAGE_SIZE_DEFAULT

export default function TransactionListPage() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const userId = profile?.id
  const { filters, setFilters, resetFilters } = useTransactionFilters()
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
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
  const { data: userTags } = useQuery({
    queryKey: queryKeys.transactions.tags(userId as string),
    queryFn: () => getUserTags(userId as string),
    enabled: Boolean(userId),
  })

  const accountLabelById = useMemo(() => new Map((accounts ?? []).map((a) => [a.id, a.name])), [accounts])
  const categoryLabelById = useMemo(() => new Map((categories ?? []).map((c) => [c.id, c.name])), [categories])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.type) count++
    if (filters.accountId) count++
    if (filters.categoryId) count++
    if (filters.dateFrom || filters.dateTo) count++
    if (filters.amountMin != null || filters.amountMax != null) count++
    if (filters.tags && filters.tags.length > 0) count += filters.tags.length
    return count
  }, [filters])

  const hasActiveFilters = Boolean(filters.search?.trim() || activeFilterCount > 0)

  const [prevSearch, setPrevSearch] = useState(filters.search)
  if (filters.search !== prevSearch) {
    setPrevSearch(filters.search)
    setSearchInput(filters.search ?? "")
  }

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
          <div className="flex items-center gap-2">
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari deskripsi…"
              aria-label="Cari transaksi berdasarkan deskripsi"
              className="touch-target flex-1"
            />
            <Button
              type="button"
              variant={activeFilterCount > 0 ? "default" : "outline"}
              className="touch-target shrink-0 gap-1.5"
              onClick={() => setIsFilterSheetOpen(true)}
              aria-label="Buka filter lanjutan"
            >
              <SlidersHorizontal size={16} />
              <span className="hidden sm:inline">Filter</span>
              {activeFilterCount > 0 && (
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary-foreground text-primary text-[11px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>
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
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-xs text-muted-foreground font-medium">Filter:</span>

              {filters.search && (
                <Badge variant="secondary" className="text-xs flex items-center gap-1 py-0.5 px-2">
                  <span>Cari: &ldquo;{filters.search}&rdquo;</span>
                  <button type="button" onClick={() => { setSearchInput(""); setFilters({ search: undefined }) }}>
                    <X size={12} />
                  </button>
                </Badge>
              )}

              {filters.type && (
                <Badge variant="secondary" className="text-xs flex items-center gap-1 py-0.5 px-2">
                  <span>{formatTransactionType(filters.type)}</span>
                  <button type="button" onClick={() => setFilters({ type: undefined })}>
                    <X size={12} />
                  </button>
                </Badge>
              )}

              {filters.categoryId && (
                <Badge variant="secondary" className="text-xs flex items-center gap-1 py-0.5 px-2">
                  <span>{categoryLabelById.get(filters.categoryId) ?? "Kategori"}</span>
                  <button type="button" onClick={() => setFilters({ categoryId: undefined })}>
                    <X size={12} />
                  </button>
                </Badge>
              )}

              {filters.accountId && (
                <Badge variant="secondary" className="text-xs flex items-center gap-1 py-0.5 px-2">
                  <span>{accountLabelById.get(filters.accountId) ?? "Rekening"}</span>
                  <button type="button" onClick={() => setFilters({ accountId: undefined })}>
                    <X size={12} />
                  </button>
                </Badge>
              )}

              {(filters.dateFrom || filters.dateTo) && (
                <Badge variant="secondary" className="text-xs flex items-center gap-1 py-0.5 px-2">
                  <span>{filters.dateFrom || "Awal"} - {filters.dateTo || "Akhir"}</span>
                  <button type="button" onClick={() => setFilters({ dateFrom: undefined, dateTo: undefined })}>
                    <X size={12} />
                  </button>
                </Badge>
              )}

              {(filters.amountMin != null || filters.amountMax != null) && (
                <Badge variant="secondary" className="text-xs flex items-center gap-1 py-0.5 px-2">
                  <span>
                    {filters.amountMin != null ? formatCurrency(filters.amountMin) : "0"} -{" "}
                    {filters.amountMax != null ? formatCurrency(filters.amountMax) : "∞"}
                  </span>
                  <button type="button" onClick={() => setFilters({ amountMin: undefined, amountMax: undefined })}>
                    <X size={12} />
                  </button>
                </Badge>
              )}

              {filters.tags?.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs flex items-center gap-1 py-0.5 px-2 bg-primary/20 text-primary-foreground border-primary/30">
                  <span>{tag}</span>
                  <button type="button" onClick={() => setFilters({ tags: filters.tags?.filter((t) => t !== tag) })}>
                    <X size={12} />
                  </button>
                </Badge>
              ))}

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-xs text-destructive hover:text-destructive"
                onClick={() => {
                  setSearchInput("")
                  resetFilters()
                }}
              >
                Reset
              </Button>
            </div>
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
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{t.description || (t.categories?.name ?? "Transaksi")}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {formatShortDate(t.transaction_date)} • {t.accounts?.name ?? "Rekening"}
                    </p>
                    {isTransfer && (
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {isTransferOut ? "Transfer keluar" : isTransferIn ? "Transfer masuk" : "Transfer"}
                      </p>
                    )}
                    {Array.isArray(t.tags) && t.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {t.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-block rounded px-1.5 py-0.5 text-[10px] font-medium bg-primary/15 text-primary-foreground border border-primary/20"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <AmountDisplay
                      amount={amountSigned}
                      showSign
                      className={cn(
                        "shrink-0 text-sm",
                        (t.type === "income" || (isTransfer && !isTransferOut)) && "text-success"
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
      <TransactionFilterSheet
        open={isFilterSheetOpen}
        onOpenChange={setIsFilterSheetOpen}
        filters={filters}
        onApplyFilters={setFilters}
        onResetFilters={resetFilters}
        accounts={accounts ?? []}
        categories={categories ?? []}
        userTags={userTags ?? []}
      />
    </div>
  )
}

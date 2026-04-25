import { useMemo, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageLoading } from "@/components/shared/LoadingSpinner"
import { BillForm } from "@/components/bills/BillForm"
import { formatCurrency } from "@/lib/formatters"
import { queryClient, queryKeys } from "@/lib/query-client"
import { createBill, deleteBill, getBills, setBillActive, type BillListRow } from "@/services/bills.service"
import { supabase } from "@/services/supabase"
import { useAuthStore } from "@/stores/auth-store"
import type { BillInput as BillFormInput } from "@/lib/validators"
import { addDaysYmd, addMonthsYmd, todayYmd } from "@/lib/dates"
import { parseIdrInteger } from "@/lib/money"

const frequencyLabel: Record<string, string> = {
  daily: "Harian",
  weekly: "Mingguan",
  monthly: "Bulanan",
  yearly: "Tahunan",
}

function computeEndDateFromFrequency(nextDate: string, frequency: BillFormInput["frequency"]): string {
  return frequency === "daily"
    ? addDaysYmd(nextDate, 1)
    : frequency === "weekly"
      ? addDaysYmd(nextDate, 7)
      : frequency === "monthly"
        ? addMonthsYmd(nextDate, 1)
        : addMonthsYmd(nextDate, 12)
}

export default function BillsPage() {
  const { profile } = useAuthStore()
  const userId = profile?.id ?? ""
  const [showCreate, setShowCreate] = useState(false)

  const {
    data: bills,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.bills.all,
    queryFn: async () => {
      if (!userId) return [] as BillListRow[]
      return getBills(userId)
    },
    enabled: Boolean(userId),
  })

  const createMutation = useMutation({
    mutationFn: async (data: BillFormInput) => {
      if (!userId) throw new Error("Kamu belum login.")
      const amountNumber = parseIdrInteger(data.amount)
      if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
        throw new Error("Jumlah tidak valid.")
      }
      const category_id = data.category_id && data.category_id !== "" ? data.category_id : null
      const end_date = data.can_end
        ? data.end_date?.trim()
          ? data.end_date.trim()
          : computeEndDateFromFrequency(data.next_date, data.frequency)
        : null
      const description = data.description?.trim() ? data.description.trim() : null
      const startDate = data.next_date
      const isStartToday = startDate === todayYmd()
      const next_date = isStartToday ? computeEndDateFromFrequency(startDate, data.frequency) : startDate
      const created = await createBill({
        user_id: userId,
        account_id: data.account_id,
        category_id,
        name: data.name.trim(),
        amount: amountNumber,
        type: data.type,
        frequency: data.frequency,
        next_date,
        end_date,
        description,
      })

      if (isStartToday) {
        const { data: accountRow, error: accountErr } = await supabase
          .from("accounts")
          .select("balance")
          .eq("user_id", userId)
          .eq("id", data.account_id)
          .single()
        if (accountErr) throw accountErr
        if (Number(accountRow?.balance ?? 0) < amountNumber) {
          throw new Error("Saldo tidak cukup untuk debit pertama (hari ini).")
        }

        const { error: txError } = await supabase.from("transactions").insert({
          user_id: userId,
          account_id: data.account_id,
          category_id,
          type: "expense",
          amount: amountNumber,
          description: description ?? data.name.trim(),
          transaction_date: startDate,
          is_recurring: true,
          bill_id: created.id,
        })
        if (txError) throw txError

        const { error: billUpdateError } = await supabase
          .from("bills")
          .update({ last_processed_at: new Date().toISOString() })
          .eq("user_id", userId)
          .eq("id", created.id)
        if (billUpdateError) throw billUpdateError
      }
    },
    onSuccess: async () => {
      setShowCreate(false)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.bills.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary }),
      ])
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ billId, isActive }: { billId: string; isActive: boolean }) => {
      if (!userId) throw new Error("Kamu belum login.")
      await setBillActive(userId, billId, isActive)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.bills.all })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (billId: string) => {
      if (!userId) throw new Error("Kamu belum login.")
      await deleteBill(userId, billId)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.bills.all })
    },
  })

  const hasBills = (bills?.length ?? 0) > 0

  const grouped = useMemo(() => {
    const all = bills ?? []
    return {
      active: all.filter((b) => b.is_active && b.status === "active"),
      paused: all.filter((b) => !b.is_active || b.status === "paused"),
      failed: all.filter((b) => b.status === "failed"),
    }
  }, [bills])

  if (isLoading) return <PageLoading />

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Auto-Debit</h1>
          <p className="text-sm text-muted-foreground">Jadwalkan pengeluaran berulang otomatis.</p>
        </div>

        <Button className="touch-target" onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? "Tutup" : "+ Buat Auto-Debit"}
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Buat Auto-Debit</CardTitle>
          </CardHeader>
          <CardContent>
            <BillForm
              userId={userId}
              submitLabel={createMutation.isPending ? "Menyimpan..." : "Simpan"}
              onSubmit={async (data) => createMutation.mutateAsync(data)}
            />
          </CardContent>
        </Card>
      )}

      {isError ? (
        <EmptyState
          title="Gagal memuat auto-debit"
          description="Coba refresh halaman. Jika masih gagal, pastikan kamu sudah login dan aturan akses database (RLS) mengizinkan data dibaca."
          action={
            <Button onClick={() => window.location.reload()} className="touch-target">
              Refresh
            </Button>
          }
        />
      ) : !hasBills ? (
        <EmptyState
          title="Belum ada auto-debit"
          description="Buat jadwal tagihan berulang agar transaksi bisa berjalan otomatis."
          action={
            <Button onClick={() => setShowCreate(true)} className="touch-target">
              Buat Auto-Debit
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          <BillSection
            title="Aktif"
            items={grouped.active}
            onPause={(id) => toggleMutation.mutate({ billId: id, isActive: false })}
            onResume={(id) => toggleMutation.mutate({ billId: id, isActive: true })}
            onDelete={(id) => deleteMutation.mutate(id)}
            busyIds={new Set([
              ...(toggleMutation.variables ? [toggleMutation.variables.billId] : []),
              ...(deleteMutation.variables ? [deleteMutation.variables] : []),
            ])}
          />
          {grouped.failed.length > 0 && (
            <BillSection
              title="Gagal"
              items={grouped.failed}
              onPause={(id) => toggleMutation.mutate({ billId: id, isActive: false })}
              onResume={(id) => toggleMutation.mutate({ billId: id, isActive: true })}
              onDelete={(id) => deleteMutation.mutate(id)}
              busyIds={new Set([
                ...(toggleMutation.variables ? [toggleMutation.variables.billId] : []),
                ...(deleteMutation.variables ? [deleteMutation.variables] : []),
              ])}
            />
          )}
          {grouped.paused.length > 0 && (
            <BillSection
              title="Dijeda"
              items={grouped.paused}
              onPause={(id) => toggleMutation.mutate({ billId: id, isActive: false })}
              onResume={(id) => toggleMutation.mutate({ billId: id, isActive: true })}
              onDelete={(id) => deleteMutation.mutate(id)}
              busyIds={new Set([
                ...(toggleMutation.variables ? [toggleMutation.variables.billId] : []),
                ...(deleteMutation.variables ? [deleteMutation.variables] : []),
              ])}
            />
          )}
        </div>
      )}
    </div>
  )
}

function BillSection({
  title,
  items,
  onPause,
  onResume,
  onDelete,
  busyIds,
}: {
  title: string
  items: BillListRow[]
  onPause: (id: string) => void
  onResume: (id: string) => void
  onDelete: (id: string) => void
  busyIds: Set<string>
}) {
  if (items.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {title} <span className="text-muted-foreground">({items.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {items.map((b) => {
          const isBusy = busyIds.has(b.id)
          const accountName = b.accounts?.name ?? "—"
          const categoryName = b.categories?.name ?? ""

          return (
            <div key={b.id} className="rounded-lg border bg-card p-3">
              <div className="grid gap-3">
                <div className="grid grid-cols-1 gap-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{b.name}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          Pengeluaran
                        </span>
                        {categoryName ? (
                          <span className="text-xs text-muted-foreground truncate">Kategori: {categoryName}</span>
                        ) : null}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-semibold money">{formatCurrency(Number(b.amount))}</div>
                      <div className="text-xs text-muted-foreground">Berikutnya: {b.next_date}</div>
                    </div>
                  </div>
                </div>

                <dl className="grid grid-cols-1 gap-1 text-xs text-muted-foreground sm:grid-cols-2 sm:gap-x-4">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="shrink-0">Rekening</dt>
                    <dd className="min-w-0 truncate text-foreground/80">{accountName}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="shrink-0">Frekuensi</dt>
                    <dd className="min-w-0 truncate text-foreground/80">
                      {frequencyLabel[b.frequency] ?? b.frequency}
                    </dd>
                  </div>
                  {b.end_date ? (
                    <div className="flex items-center justify-between gap-3">
                      <dt className="shrink-0">Sampai</dt>
                      <dd className="min-w-0 truncate text-foreground/80">{b.end_date}</dd>
                    </div>
                  ) : null}
                  {b.description ? (
                    <div className="flex items-center justify-between gap-3 sm:col-span-2">
                      <dt className="shrink-0">Catatan</dt>
                      <dd className="min-w-0 truncate text-foreground/80">{b.description}</dd>
                    </div>
                  ) : null}
                </dl>

                <div className="grid grid-cols-2 gap-2">
                  {b.is_active && b.status === "active" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => onPause(b.id)}
                      disabled={isBusy}
                    >
                      Jeda
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => onResume(b.id)}
                      disabled={isBusy}
                    >
                      Aktifkan
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-destructive hover:text-destructive"
                    onClick={() => onDelete(b.id)}
                    disabled={isBusy}
                  >
                    Hapus
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}


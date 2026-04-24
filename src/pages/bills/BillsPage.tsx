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
import { parseIdrInteger } from "@/lib/money"

const frequencyLabel: Record<string, string> = {
  daily: "Harian",
  weekly: "Mingguan",
  monthly: "Bulanan",
  yearly: "Tahunan",
}

function todayYmd(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function daysInMonthUtc(year: number, month1: number): number {
  return new Date(Date.UTC(year, month1, 0)).getUTCDate()
}

function addDaysYmd(ymd: string, days: number): string {
  const [yStr, mStr, dStr] = ymd.split("-")
  const year = Number(yStr)
  const month1 = Number(mStr)
  const day = Number(dStr)

  if (!Number.isFinite(year) || !Number.isFinite(month1) || !Number.isFinite(day)) return ymd

  const base = new Date(Date.UTC(year, month1 - 1, day))
  base.setUTCDate(base.getUTCDate() + days)

  const outY = base.getUTCFullYear()
  const outM = String(base.getUTCMonth() + 1).padStart(2, "0")
  const outD = String(base.getUTCDate()).padStart(2, "0")
  return `${outY}-${outM}-${outD}`
}

function addMonthsYmd(ymd: string, months: number): string {
  const [yStr, mStr, dStr] = ymd.split("-")
  const year = Number(yStr)
  const month1 = Number(mStr)
  const day = Number(dStr)

  if (!Number.isFinite(year) || !Number.isFinite(month1) || !Number.isFinite(day)) return ymd

  const targetMonth0 = month1 - 1 + months
  const base = new Date(Date.UTC(year, targetMonth0, 1))
  const targetYear = base.getUTCFullYear()
  const targetMonth1 = base.getUTCMonth() + 1
  const clampedDay = Math.min(day, daysInMonthUtc(targetYear, targetMonth1))
  const result = new Date(Date.UTC(targetYear, targetMonth1 - 1, clampedDay))

  const outY = result.getUTCFullYear()
  const outM = String(result.getUTCMonth() + 1).padStart(2, "0")
  const outD = String(result.getUTCDate()).padStart(2, "0")
  return `${outY}-${outM}-${outD}`
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
          const meta = [
            `Rekening: ${accountName}`,
            categoryName ? `Kategori: ${categoryName}` : null,
            `Frekuensi: ${frequencyLabel[b.frequency] ?? b.frequency}`,
            `Berikutnya: ${b.next_date}`,
            b.end_date ? `Sampai: ${b.end_date}` : null,
          ].filter(Boolean)

          return (
            <div key={b.id} className="rounded-lg border bg-card p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-semibold">{b.name}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      Pengeluaran
                    </span>
                    <span className="font-semibold tabular-nums">{formatCurrency(Number(b.amount))}</span>
                  </div>
                  <div className="mt-1 flex flex-col gap-0.5 text-xs text-muted-foreground">
                    {meta.map((m) => (
                      <span key={m as string}>{m}</span>
                    ))}
                    {b.description ? <span>Catatan: {b.description}</span> : null}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {b.is_active && b.status === "active" ? (
                    <Button
                      variant="outline"
                      className="touch-target"
                      onClick={() => onPause(b.id)}
                      disabled={isBusy}
                    >
                      Jeda
                    </Button>
                  ) : (
                    <Button className="touch-target" onClick={() => onResume(b.id)} disabled={isBusy}>
                      Aktifkan
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="touch-target text-destructive hover:text-destructive"
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


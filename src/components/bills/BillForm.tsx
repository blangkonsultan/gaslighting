import { useEffect, useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { formatCurrency } from "@/lib/formatters"
import { getAccounts } from "@/services/accounts.service"
import { getCategories } from "@/services/admin.service"
import { billSchema, type BillInput as BillFormInput } from "@/lib/validators"
import { formatIdrIntegerInput, parseIdrInteger } from "@/lib/money"
import { queryKeys } from "@/lib/query-client"
import type { Account, Category } from "@/types/financial"

const frequencyLabels: Record<BillFormInput["frequency"], string> = {
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

export function BillForm({
  userId,
  submitLabel,
  onSubmit,
}: {
  userId: string
  submitLabel: string
  onSubmit: (data: BillFormInput) => Promise<void>
}) {
  const [error, setError] = useState("")

  const {
    handleSubmit,
    register,
    setError: setFieldError,
    setValue,
    watch,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<BillFormInput>({
    resolver: zodResolver(billSchema),
    defaultValues: {
      type: "expense",
      account_id: "",
      category_id: "",
      name: "",
      amount: "",
      frequency: "monthly",
      next_date: todayYmd(),
      can_end: false,
      end_date: "",
      description: "",
    },
  })

  const selectedAccountId = watch("account_id")
  const selectedCategoryId = watch("category_id")
  const selectedFrequency = watch("frequency")
  const nextDate = watch("next_date")
  const amountStr = watch("amount")
  const canEnd = watch("can_end")
  const endDate = watch("end_date")
  const lastAutoEndDateRef = useRef<string>("")

  const { data: accounts, isLoading: isAccountsLoading } = useQuery({
    queryKey: queryKeys.accounts.all,
    queryFn: async () => (await getAccounts(userId)) as Account[],
    enabled: Boolean(userId),
  })

  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: async () => (await getCategories()) as Category[],
    staleTime: 5 * 60 * 1000,
  })

  const accountLabelById = useMemo(() => new Map((accounts ?? []).map((a) => [a.id, a.name] as const)), [accounts])
  const accountBalanceById = useMemo(() => new Map((accounts ?? []).map((a) => [a.id, a.balance] as const)), [accounts])
  const categoryLabelById = useMemo(
    () => new Map((categories ?? []).map((c) => [c.id, c.name] as const)),
    [categories]
  )

  const categoryOptions = useMemo(() => {
    const all = categories ?? []
    return all.filter((c) => c.type === "expense")
  }, [categories])

  const isLoading = isAccountsLoading || isCategoriesLoading
  const selectedAccount = useMemo(
    () => (accounts ?? []).find((a) => a.id === selectedAccountId) ?? null,
    [accounts, selectedAccountId]
  )
  const selectedAccountLabel = selectedAccountId ? (accountLabelById.get(selectedAccountId) ?? selectedAccountId) : ""
  const selectedAccountBalance =
    selectedAccountId && accountBalanceById.has(selectedAccountId) ? accountBalanceById.get(selectedAccountId) : undefined
  const selectedCategoryLabel =
    selectedCategoryId && selectedCategoryId !== "" ? (categoryLabelById.get(selectedCategoryId) ?? selectedCategoryId) : ""
  const today = useMemo(() => todayYmd(), [])
  const amountNumber = useMemo(() => parseIdrInteger(amountStr), [amountStr])
  const isStartToday = nextDate === today
  const projectedBalance = useMemo(() => {
    if (!selectedAccount) return null
    if (!Number.isFinite(amountNumber)) return null
    return selectedAccount.balance - amountNumber
  }, [selectedAccount, amountNumber])

  useEffect(() => {
    if (!canEnd) {
      lastAutoEndDateRef.current = ""
      if (endDate?.trim()) setValue("end_date", "", { shouldValidate: true })
      return
    }

    const base = nextDate || todayYmd()
    const computed =
      selectedFrequency === "daily"
        ? addDaysYmd(base, 1)
        : selectedFrequency === "weekly"
          ? addDaysYmd(base, 7)
          : selectedFrequency === "monthly"
            ? addMonthsYmd(base, 1)
            : addMonthsYmd(base, 12)
    const shouldAutoSet = !endDate?.trim() || endDate === lastAutoEndDateRef.current
    if (!shouldAutoSet) return

    lastAutoEndDateRef.current = computed
    setValue("end_date", computed, { shouldValidate: true })
  }, [canEnd, selectedFrequency, nextDate, endDate, setValue])

  useEffect(() => {
    // Only block when we will insert the first transaction immediately (start date = today).
    if (!isStartToday) {
      clearErrors("amount")
      return
    }

    if (!selectedAccountId) return
    if (!selectedAccount) return
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) return

    if (amountNumber > selectedAccount.balance) {
      setFieldError("amount", { type: "validate", message: "Saldo tidak cukup untuk debit pertama (hari ini)." })
    } else {
      clearErrors("amount")
    }
  }, [
    isStartToday,
    selectedAccountId,
    selectedAccount,
    amountNumber,
    clearErrors,
    setFieldError,
  ])

  const amountField = register("amount")

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        try {
          setError("")
          await onSubmit(data)
        } catch (err) {
          setError(err instanceof Error ? err.message : "Gagal menyimpan auto-debit.")
        }
      })}
    >
      <div className="flex flex-col gap-4">
        {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Nama Tagihan</Label>
          <Input id="name" placeholder="Contoh: Netflix" className="touch-target" {...register("name")} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>Rekening</Label>
            <Select value={selectedAccountId ?? ""} onValueChange={(v) => setValue("account_id", v ?? "", { shouldValidate: true })}>
              <SelectTrigger className="touch-target w-full" disabled={isSubmitting || isLoading}>
                <SelectValue>
                  {(v) => {
                    if (!v) return isLoading ? "Memuat rekening..." : "Pilih rekening"
                    const id = String(v)
                    return accountLabelById.get(id) ?? id
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
            {errors.account_id && <p className="text-xs text-destructive">{errors.account_id.message}</p>}
            {!!selectedAccountId && !errors.account_id && (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-muted-foreground">Rekening dipilih:</span>
                  <span className="font-medium">{selectedAccountLabel}</span>
                </div>
                {typeof selectedAccountBalance === "number" && (
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-muted-foreground">Equity saat ini:</span>
                    <span className="font-medium tabular-nums">{formatCurrency(selectedAccountBalance)}</span>
                  </div>
                )}
                {projectedBalance != null && Number.isFinite(amountNumber) && amountNumber > 0 ? (
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-muted-foreground">
                      Equity setelah debit pertama ({isStartToday ? "hari ini" : "pada tanggal mulai"}):
                    </span>
                    <span className={["font-medium tabular-nums", projectedBalance < 0 ? "text-destructive" : ""].join(" ").trim()}>
                      {formatCurrency(projectedBalance)}
                    </span>
                  </div>
                ) : null}
                {!!selectedCategoryLabel && (
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-muted-foreground">Kategori:</span>
                    <span className="font-medium">{selectedCategoryLabel}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Kategori</Label>
            <Select
              value={selectedCategoryId ?? ""}
              onValueChange={(v) => setValue("category_id", v ?? "", { shouldValidate: true })}
            >
              <SelectTrigger className="touch-target w-full" disabled={isSubmitting || isLoading}>
                <SelectValue>
                  {(v) => {
                    if (!v) return isLoading ? "Memuat kategori..." : "Opsional"
                    const id = String(v)
                    return categoryLabelById.get(id) ?? id
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {categoryOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {errors.category_id && <p className="text-xs text-destructive">{errors.category_id.message}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="amount">Jumlah</Label>
            <Input
              id="amount"
              type="text"
              inputMode="numeric"
              pattern="^(0|[1-9]\d{0,2}(?:\.\d{3})*)$"
              placeholder="0"
              className="touch-target text-right tabular-nums"
              {...amountField}
              onChange={(e) => {
                const formatted = formatIdrIntegerInput(e.target.value)
                e.target.value = formatted
                amountField.onChange(e)
              }}
            />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Frekuensi</Label>
            <Select
              value={selectedFrequency ?? "monthly"}
              onValueChange={(v) => setValue("frequency", v as BillFormInput["frequency"], { shouldValidate: true })}
            >
              <SelectTrigger className="touch-target w-full" disabled={isSubmitting}>
                <SelectValue>
                  {(v) => {
                    const key = (v as BillFormInput["frequency"]) ?? "monthly"
                    return frequencyLabels[key] ?? String(v)
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {Object.entries(frequencyLabels).map(([k, label]) => (
                    <SelectItem key={k} value={k}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {errors.frequency && <p className="text-xs text-destructive">{errors.frequency.message}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="next_date">Tanggal Mulai</Label>
            <Input id="next_date" type="date" min={todayYmd()} className="touch-target" {...register("next_date")} />
            {errors.next_date && <p className="text-xs text-destructive">{errors.next_date.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label className="flex items-center justify-between gap-3">
              <span>Bisa berakhir</span>
              <Switch
                checked={Boolean(canEnd)}
                onCheckedChange={(v) => setValue("can_end", v, { shouldValidate: true })}
                disabled={isSubmitting}
              />
            </Label>
            {canEnd ? (
              <>
                <Label htmlFor="end_date">Tanggal Berakhir</Label>
                <Input id="end_date" type="date" className="touch-target" {...register("end_date")} />
                {errors.end_date && <p className="text-xs text-destructive">{errors.end_date.message}</p>}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Jika dimatikan, auto-debit berjalan terus sampai kamu jeda/hapus.</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="description">Catatan (opsional)</Label>
          <Input id="description" placeholder="Contoh: auto-debit setiap tanggal 1" className="touch-target" {...register("description")} />
          {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button type="submit" className="touch-target" disabled={isSubmitting || isLoading || (accounts?.length ?? 0) === 0}>
            {isSubmitting ? <LoadingSpinner size={18} /> : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  )
}


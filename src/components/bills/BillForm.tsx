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
import { AccountInfoPanel } from "@/components/shared/AccountInfoPanel"
import { FormField } from "@/components/shared/FormField"
import { useBalanceCheck } from "@/hooks/useBalanceCheck"
import { getAccounts } from "@/services/accounts.service"
import { getCategories } from "@/services/admin.service"
import { billSchema, type BillInput as BillFormInput } from "@/lib/validators"
import { addDaysYmd, addMonthsYmd, todayYmd } from "@/lib/dates"
import { formatIdrIntegerInput, parseIdrInteger } from "@/lib/money"
import { queryKeys } from "@/lib/query-client"
import type { Account, Category } from "@/types/financial"

const frequencyLabels: Record<BillFormInput["frequency"], string> = {
  daily: "Harian",
  weekly: "Mingguan",
  monthly: "Bulanan",
  yearly: "Tahunan",
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
  const selectedAccountLabel = selectedAccountId ? (accountLabelById.get(selectedAccountId) ?? selectedAccountId) : ""
  const selectedAccountBalance =
    selectedAccountId && accountBalanceById.has(selectedAccountId) ? accountBalanceById.get(selectedAccountId) : undefined
  const selectedCategoryLabel =
    selectedCategoryId && selectedCategoryId !== "" ? (categoryLabelById.get(selectedCategoryId) ?? selectedCategoryId) : ""
  const today = useMemo(() => todayYmd(), [])
  const amountNumber = useMemo(() => parseIdrInteger(amountStr), [amountStr])
  const isStartToday = nextDate === today

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

  const { isInsufficient, projectedBalance } = useBalanceCheck({
    amountNumber,
    accountId: selectedAccountId,
    accountBalance: selectedAccountBalance,
    setError: setFieldError,
    clearErrors,
    fieldName: "amount",
    activeWhen: isStartToday,
    message: "Saldo tidak cukup untuk debit pertama (hari ini).",
  })

  const amountField = register("amount")

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        try {
          setError("")
          if (isInsufficient) {
            setError("Saldo tidak cukup untuk debit pertama (hari ini).")
            return
          }
          await onSubmit(data)
        } catch (err) {
          setError(err instanceof Error ? err.message : "Gagal menyimpan auto-debit.")
        }
      })}
    >
      <div className="flex flex-col gap-4">
        {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        <FormField label="Nama Tagihan" htmlFor="name" error={errors.name}>
          <Input id="name" placeholder="Contoh: Netflix" className="touch-target" {...register("name")} />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Rekening" error={errors.account_id}>
            <Select value={selectedAccountId ?? ""} onValueChange={(v) => setValue("account_id", v ?? "", { shouldValidate: true })}>
              <SelectTrigger className="touch-target w-full" disabled={isSubmitting || isLoading} aria-invalid={Boolean(errors.account_id)}>
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
            {!!selectedAccountId && !errors.account_id && (
              <AccountInfoPanel
                accountLabel={selectedAccountLabel}
                balance={selectedAccountBalance}
                projectedBalance={projectedBalance}
                projectedLabel={
                  isStartToday
                    ? "Equity setelah debit pertama (hari ini):"
                    : "Equity setelah debit pertama (pada tanggal mulai):"
                }
                extraRows={
                  selectedCategoryLabel ? (
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-muted-foreground">Kategori:</span>
                      <span className="font-medium">{selectedCategoryLabel}</span>
                    </div>
                  ) : undefined
                }
              />
            )}
          </FormField>

          <FormField label="Kategori" error={errors.category_id}>
            <Select
              value={selectedCategoryId ?? ""}
              onValueChange={(v) => setValue("category_id", v ?? "", { shouldValidate: true })}
            >
              <SelectTrigger className="touch-target w-full" disabled={isSubmitting || isLoading} aria-invalid={Boolean(errors.category_id)}>
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
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Jumlah" htmlFor="amount" error={errors.amount}>
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
          </FormField>

          <FormField label="Frekuensi" error={errors.frequency}>
            <Select
              value={selectedFrequency ?? "monthly"}
              onValueChange={(v) => setValue("frequency", v as BillFormInput["frequency"], { shouldValidate: true })}
            >
              <SelectTrigger className="touch-target w-full" disabled={isSubmitting} aria-invalid={Boolean(errors.frequency)}>
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
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Tanggal Mulai" htmlFor="next_date" error={errors.next_date}>
            <Input id="next_date" type="date" min={todayYmd()} className="touch-target" {...register("next_date")} />
          </FormField>

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
              <FormField label="Tanggal Berakhir" htmlFor="end_date" error={errors.end_date}>
                <Input id="end_date" type="date" className="touch-target" {...register("end_date")} />
              </FormField>
            ) : (
              <p className="text-xs text-muted-foreground">Jika dimatikan, auto-debit berjalan terus sampai kamu jeda/hapus.</p>
            )}
          </div>
        </div>

        <FormField label="Catatan (opsional)" htmlFor="description" error={errors.description}>
          <Input id="description" placeholder="Contoh: auto-debit setiap tanggal 1" className="touch-target" {...register("description")} />
        </FormField>

        <div className="flex items-center justify-end gap-2">
          <Button type="submit" className="touch-target" disabled={isSubmitting || isLoading || (accounts?.length ?? 0) === 0}>
            {isSubmitting ? <LoadingSpinner size={18} /> : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  )
}

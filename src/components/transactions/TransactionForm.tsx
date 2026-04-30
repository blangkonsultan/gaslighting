import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { AccountInfoPanel } from "@/components/shared/AccountInfoPanel"
import { FormField } from "@/components/shared/FormField"
import { useBalanceCheck } from "@/hooks/useBalanceCheck"
import { getAccounts } from "@/services/accounts.service"
import { getCategories } from "@/services/admin.service"
import { queryKeys } from "@/lib/query-client"
import { transactionSchema, type TransactionInput } from "@/lib/validators"
import { formatIdrIntegerInput, parseIdrInteger } from "@/lib/money"
import { todayYmd } from "@/lib/dates"
import type { Account, Category } from "@/types/financial"

export type TransactionFormInitialValues = Partial<{
  type: "income" | "expense"
  account_id: string
  category_id: string | null
  amount: number
  description: string | null
  transaction_date: string
}>

function toFormDefaults(initial?: TransactionFormInitialValues): TransactionInput {
  const category = initial?.category_id ?? ""
  return {
    type: initial?.type ?? "expense",
    account_id: initial?.account_id ?? "",
    category_id: category ?? "",
    amount: initial?.amount != null ? formatIdrIntegerInput(String(initial.amount)) : "",
    description: (initial?.description ?? "").trim(),
    transaction_date: initial?.transaction_date ?? todayYmd(),
  }
}

export function TransactionForm({
  userId,
  initialValues,
  submitLabel,
  onCancel,
  onSubmit,
}: {
  userId: string
  initialValues?: TransactionFormInitialValues
  submitLabel: string
  onCancel: () => void
  onSubmit: (data: TransactionInput) => Promise<void>
}) {
  const [error, setError] = useState("")

  const {
    handleSubmit,
    register,
    setValue,
    watch,
    setError: setFieldError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: toFormDefaults(initialValues),
  })

  const txType = watch("type")
  const selectedAccountId = watch("account_id")
  const selectedCategoryId = watch("category_id")
  const amountStr = watch("amount")

  const amountNumber = useMemo(() => parseIdrInteger(amountStr), [amountStr])

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

  const accountLabelById = useMemo(() => {
    return new Map((accounts ?? []).map((a) => [a.id, a.name] as const))
  }, [accounts])

  const accountBalanceById = useMemo(() => {
    return new Map((accounts ?? []).map((a) => [a.id, a.balance] as const))
  }, [accounts])

  const categoryLabelById = useMemo(() => {
    return new Map((categories ?? []).map((c) => [c.id, c.name] as const))
  }, [categories])

  const selectedAccountLabel = selectedAccountId ? (accountLabelById.get(selectedAccountId) ?? selectedAccountId) : ""
  const selectedAccountBalance =
    selectedAccountId && accountBalanceById.has(selectedAccountId) ? accountBalanceById.get(selectedAccountId) : undefined
  const selectedCategoryLabel =
    selectedCategoryId && selectedCategoryId !== "" ? (categoryLabelById.get(selectedCategoryId) ?? selectedCategoryId) : ""

  const categoryOptions = useMemo(() => {
    const all = categories ?? []
    return all.filter((c) => c.type === txType)
  }, [categories, txType])

  const isLoading = isAccountsLoading || isCategoriesLoading
  const isCategoryMissing = !selectedCategoryId || selectedCategoryId === ""

  const { isInsufficient } = useBalanceCheck({
    amountNumber,
    accountId: selectedAccountId,
    accountBalance: selectedAccountBalance,
    setError: setFieldError,
    clearErrors,
    activeWhen: txType === "expense",
  })

  const equityNow = typeof selectedAccountBalance === "number" ? selectedAccountBalance : null
  const equityAfter =
    equityNow != null && Number.isFinite(amountNumber) && amountNumber > 0
      ? txType === "income"
        ? equityNow + amountNumber
        : equityNow - amountNumber
      : null

  const amountField = register("amount")

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        try {
          setError("")
          if (isInsufficient) {
            setError("Saldo tidak cukup.")
            return
          }
          await onSubmit(data)
        } catch (err) {
          setError(err instanceof Error ? err.message : "Gagal menyimpan transaksi.")
        }
      })}
    >
      <div className="flex flex-col gap-5">
        {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        <FormField label="Tipe" error={errors.type}>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={[
                "touch-target rounded-lg border-2 p-2.5 text-sm font-medium transition-colors",
                txType === "expense"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50",
              ].join(" ")}
              onClick={() => setValue("type", "expense", { shouldValidate: true })}
              disabled={isSubmitting}
            >
              Pengeluaran
            </button>
            <button
              type="button"
              className={[
                "touch-target rounded-lg border-2 p-2.5 text-sm font-medium transition-colors",
                txType === "income"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50",
              ].join(" ")}
              onClick={() => setValue("type", "income", { shouldValidate: true })}
              disabled={isSubmitting}
            >
              Pemasukan
            </button>
          </div>
        </FormField>

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
              projectedBalance={equityAfter}
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
          {!isLoading && (accounts?.length ?? 0) === 0 && (
            <p className="text-xs text-muted-foreground">Kamu belum punya rekening. Buat dulu di halaman Rekening.</p>
          )}
        </FormField>

        <FormField label="Kategori" error={errors.category_id}>
          <Select value={selectedCategoryId ?? ""} onValueChange={(v) => setValue("category_id", v ?? "", { shouldValidate: true })}>
            <SelectTrigger
              className="touch-target w-full"
              disabled={isSubmitting || isLoading}
              aria-invalid={Boolean(errors.category_id)}
            >
              <SelectValue>
                {(v) => {
                  if (!v) return isLoading ? "Memuat kategori..." : "Pilih kategori"
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

        <FormField label="Jumlah" htmlFor="amount" error={errors.amount}>
          <Input
            id="amount"
            type="text"
            inputMode="numeric"
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

        <FormField label="Deskripsi" htmlFor="description" error={errors.description}>
          <Input
            id="description"
            placeholder={txType === "expense" ? "Contoh: makan siang" : "Contoh: gaji"}
            className="touch-target"
            {...register("description")}
          />
        </FormField>

        <FormField label="Tanggal" htmlFor="transaction_date" error={errors.transaction_date}>
          <Input id="transaction_date" type="date" max={todayYmd()} className="touch-target" {...register("transaction_date")} />
        </FormField>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            className="w-full touch-target"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            type="submit"
            className="w-full touch-target"
            disabled={isSubmitting || (accounts?.length ?? 0) === 0 || isCategoryMissing}
          >
            {isSubmitting ? <LoadingSpinner size={18} /> : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  )
}

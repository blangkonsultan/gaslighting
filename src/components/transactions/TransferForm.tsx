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
import { queryKeys } from "@/lib/query-client"
import { transferSchema, type TransferInput } from "@/lib/validators"
import { formatIdrIntegerInput, parseIdrInteger } from "@/lib/money"
import { todayYmd } from "@/lib/dates"
import type { Account } from "@/types/financial"

export type TransferFormInitialValues = Partial<{
  from_account_id: string
  to_account_id: string
  amount: number
  description: string | null
  transaction_date: string
}>

function toFormDefaults(initial?: TransferFormInitialValues): TransferInput {
  return {
    from_account_id: initial?.from_account_id ?? "",
    to_account_id: initial?.to_account_id ?? "",
    amount: initial?.amount != null ? formatIdrIntegerInput(String(initial.amount)) : "",
    description: (initial?.description ?? "").trim(),
    transaction_date: initial?.transaction_date ?? todayYmd(),
  }
}

export function TransferForm({
  userId,
  initialValues,
  submitLabel,
  onCancel,
  onSubmit,
}: {
  userId: string
  initialValues?: TransferFormInitialValues
  submitLabel: string
  onCancel: () => void
  onSubmit: (data: TransferInput) => Promise<void>
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
  } = useForm<TransferInput>({
    resolver: zodResolver(transferSchema),
    defaultValues: toFormDefaults(initialValues),
  })

  const fromAccountId = watch("from_account_id")
  const toAccountId = watch("to_account_id")
  const amountStr = watch("amount")
  const amountNumber = useMemo(() => parseIdrInteger(amountStr), [amountStr])

  const { data: accounts, isLoading: isAccountsLoading } = useQuery({
    queryKey: queryKeys.accounts.all,
    queryFn: async () => (await getAccounts(userId)) as Account[],
    enabled: Boolean(userId),
  })

  const isLoading = isAccountsLoading
  const allAccounts = accounts ?? []

  const accountLabelById = useMemo(() => {
    return new Map(allAccounts.map((a) => [a.id, a.name] as const))
  }, [allAccounts])

  const accountBalanceById = useMemo(() => {
    return new Map(allAccounts.map((a) => [a.id, a.balance] as const))
  }, [allAccounts])

  const fromOptions = useMemo(() => {
    if (!toAccountId) return allAccounts
    return allAccounts.filter((a) => a.id !== toAccountId)
  }, [allAccounts, toAccountId])

  const toOptions = useMemo(() => {
    if (!fromAccountId) return allAccounts
    return allAccounts.filter((a) => a.id !== fromAccountId)
  }, [allAccounts, fromAccountId])

  const fromLabel = fromAccountId ? (accountLabelById.get(fromAccountId) ?? fromAccountId) : ""
  const toLabel = toAccountId ? (accountLabelById.get(toAccountId) ?? toAccountId) : ""
  const fromBalance =
    fromAccountId && accountBalanceById.has(fromAccountId) ? accountBalanceById.get(fromAccountId) : undefined
  const toBalance = toAccountId && accountBalanceById.has(toAccountId) ? accountBalanceById.get(toAccountId) : undefined

  const fromAfter =
    typeof fromBalance === "number" && Number.isFinite(amountNumber) && amountNumber > 0 ? fromBalance - amountNumber : null
  const toAfter =
    typeof toBalance === "number" && Number.isFinite(amountNumber) && amountNumber > 0 ? toBalance + amountNumber : null

  const { isInsufficient } = useBalanceCheck({
    amountNumber,
    accountId: fromAccountId,
    accountBalance: fromBalance,
    setError: setFieldError,
    clearErrors,
    fieldName: "amount",
    activeWhen: true,
  })

  const amountField = register("amount")

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        try {
          setError("")

          const amount = parseIdrInteger(data.amount)
          if (!Number.isFinite(amount) || amount <= 0) {
            setError("Jumlah tidak valid.")
            return
          }

          if (isInsufficient) {
            setError("Saldo tidak cukup.")
            return
          }

          await onSubmit(data)
        } catch (err) {
          setError(err instanceof Error ? err.message : "Gagal memproses transfer.")
        }
      })}
    >
      <div className="flex flex-col gap-5">
        {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        <FormField
          label={
            <div className="flex items-center justify-between gap-3">
              <span>Rekening asal</span>
              {fromAccountId ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setValue("from_account_id", "", { shouldValidate: true })}
                  disabled={isSubmitting}
                >
                  Hapus pilihan
                </Button>
              ) : null}
            </div>
          }
          error={errors.from_account_id}
        >
          <Select value={fromAccountId ?? ""} onValueChange={(v) => setValue("from_account_id", v ?? "", { shouldValidate: true })}>
            <SelectTrigger className="touch-target w-full" disabled={isSubmitting || isLoading} aria-invalid={Boolean(errors.from_account_id)}>
              <SelectValue>
                {(v) => {
                  if (!v) return isLoading ? "Memuat rekening..." : "Pilih rekening asal"
                  const id = String(v)
                  return accountLabelById.get(id) ?? id
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {fromOptions.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {!!fromAccountId && !errors.from_account_id && (
            <AccountInfoPanel
              accountLabel={fromLabel}
              balance={fromBalance}
              projectedBalance={fromAfter}
              projectedLabel="Saldo setelah transfer:"
            />
          )}
        </FormField>

        <FormField
          label={
            <div className="flex items-center justify-between gap-3">
              <span>Rekening tujuan</span>
              {toAccountId ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setValue("to_account_id", "", { shouldValidate: true })}
                  disabled={isSubmitting}
                >
                  Hapus pilihan
                </Button>
              ) : null}
            </div>
          }
          error={errors.to_account_id}
        >
          <Select value={toAccountId ?? ""} onValueChange={(v) => setValue("to_account_id", v ?? "", { shouldValidate: true })}>
            <SelectTrigger className="touch-target w-full" disabled={isSubmitting || isLoading} aria-invalid={Boolean(errors.to_account_id)}>
              <SelectValue>
                {(v) => {
                  if (!v) return isLoading ? "Memuat rekening..." : "Pilih rekening tujuan"
                  const id = String(v)
                  return accountLabelById.get(id) ?? id
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {toOptions.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {!!toAccountId && !errors.to_account_id && (
            <AccountInfoPanel
              accountLabel={toLabel}
              balance={toBalance}
              projectedBalance={toAfter}
              projectedLabel="Saldo setelah transfer:"
            />
          )}
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

        <FormField label="Catatan (opsional)" htmlFor="description" error={errors.description}>
          <Input id="description" placeholder="Contoh: pindah dana untuk bayar tagihan" className="touch-target" {...register("description")} />
        </FormField>

        <FormField label="Tanggal" htmlFor="transaction_date" error={errors.transaction_date}>
          <Input id="transaction_date" type="date" max={todayYmd()} className="touch-target" {...register("transaction_date")} />
        </FormField>

        {!isLoading && allAccounts.length === 0 && (
          <p className="text-xs text-muted-foreground">Kamu belum punya rekening. Buat dulu di halaman Rekening.</p>
        )}

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
          <Button type="submit" className="w-full touch-target" disabled={isSubmitting || allAccounts.length < 2}>
            {isSubmitting ? <LoadingSpinner size={18} /> : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  )
}

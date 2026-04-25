import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Wallet, Building2, Smartphone, PiggyBank, TrendingUp, CircleDot } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { FormField } from "@/components/shared/FormField"
import { supabase } from "@/services/supabase"
import { useAuthStore } from "@/stores/auth-store"
import { ACCOUNT_TYPES, type AccountType } from "@/lib/constants"
import { formatCurrency } from "@/lib/formatters"
import { queryKeys } from "@/lib/query-client"
import { cn } from "@/lib/utils"
import { accountSchema, type AccountInput } from "@/lib/validators"
import { getAccountPresets } from "@/services/admin.service"
import type { Tables } from "@/types/database"
import { formatIdrIntegerInput, parseIdrInteger } from "@/lib/money"

const accountTypeOptions: { value: AccountType; label: string; icon: typeof Wallet }[] = [
  { value: "bank", label: "Bank", icon: Building2 },
  { value: "ewallet", label: "E-Wallet", icon: Smartphone },
  { value: "cash", label: "Tunai", icon: Wallet },
  { value: "savings", label: "Tabungan", icon: PiggyBank },
  { value: "investment", label: "Investasi", icon: TrendingUp },
  { value: "other", label: "Lainnya", icon: CircleDot },
]

type AccountPreset = Tables<"account_presets">

export default function AccountCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { profile } = useAuthStore()
  const [error, setError] = useState("")

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AccountInput>({
    resolver: zodResolver(accountSchema),
    defaultValues: { name: "", type: ACCOUNT_TYPES[0], initial_balance: "0", notes: "" },
  })

  const selectedType = watch("type")
  const initialBalance = watch("initial_balance")
  const previewBalance = useMemo(() => {
    const n = parseIdrInteger(initialBalance ?? "")
    return Number.isFinite(n) ? formatCurrency(n) : "Rp0"
  }, [initialBalance])

  const { data: accountPresets } = useQuery({
    queryKey: ["account-presets"],
    queryFn: getAccountPresets,
    staleTime: 5 * 60 * 1000,
  })

  const namePresetOptions = useMemo(() => {
    const presets = (accountPresets ?? []) as AccountPreset[]
    const filtered = presets.filter((p) => p.type === selectedType)
    const seen = new Set<string>()
    const unique: string[] = []
    for (const p of filtered) {
      const name = (p.name ?? "").trim()
      if (!name) continue
      const key = name.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      unique.push(name)
    }
    return unique
  }, [accountPresets, selectedType])

  const datalistId = `account-name-presets-${selectedType}`
  const initialBalanceField = register("initial_balance")

  async function onSubmit(data: AccountInput) {
    if (!profile?.id) {
      setError("Sesi login tidak ditemukan. Silakan login ulang.")
      navigate("/auth/login")
      return
    }

    try {
      setError("")
      const initialBalanceNumber = parseIdrInteger(data.initial_balance)
      if (!Number.isFinite(initialBalanceNumber)) {
        throw new Error("Saldo awal tidak valid.")
      }

      const { error: insertError } = await supabase.from("accounts").insert({
        user_id: profile.id,
        name: data.name,
        type: data.type,
        initial_balance: initialBalanceNumber,
        balance: initialBalanceNumber,
        notes: data.notes?.trim() ? data.notes.trim() : null,
      })

      if (insertError) throw insertError

      await queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all })
      navigate("/accounts")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat rekening.")
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl p-4 lg:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Tambah Rekening</CardTitle>
          <CardDescription>Tambahkan rekening bank, e-wallet, atau dompet cash.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="flex flex-col gap-5">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <FormField label="Nama Rekening" htmlFor="name" error={errors.name}>
              <Input
                id="name"
                placeholder="Contoh: BCA, GoPay, Dompet"
                autoComplete="organization"
                className="touch-target"
                list={datalistId}
                {...register("name")}
              />
              <datalist id={datalistId}>
                {namePresetOptions.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </FormField>

            <FormField label="Tipe Rekening" error={errors.type}>
              <div className="grid grid-cols-3 gap-2">
                {accountTypeOptions.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setValue("type", value, { shouldValidate: true })}
                    className={cn(
                      "touch-target flex flex-col items-center gap-1 rounded-lg border-2 p-2.5 text-xs transition-colors",
                      selectedType === value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    <Icon size={20} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </FormField>

            <FormField label="Saldo Awal" htmlFor="initial_balance" error={errors.initial_balance}>
              <div className="rounded-lg bg-muted/50 p-3 text-center text-lg font-semibold text-foreground">
                {previewBalance}
              </div>
              <Input
                id="initial_balance"
                type="text"
                inputMode="numeric"
                pattern="^(0|[1-9]\\d{0,2}(?:\\.\\d{3})*)$"
                placeholder="0"
                className="touch-target text-right tabular-nums"
                {...initialBalanceField}
                onChange={(e) => {
                  const formatted = formatIdrIntegerInput(e.target.value)
                  e.target.value = formatted
                  initialBalanceField.onChange(e)
                }}
              />
            </FormField>

            <FormField label="Catatan (opsional)" htmlFor="notes" error={errors.notes}>
              <Input
                id="notes"
                placeholder="Contoh: rekening utama"
                className="touch-target"
                {...register("notes")}
              />
            </FormField>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="touch-target"
                onClick={() => navigate("/accounts")}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" className="touch-target" disabled={isSubmitting}>
                {isSubmitting ? <LoadingSpinner size={18} /> : "Simpan"}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}

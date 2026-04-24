import { useState, useMemo } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/services/supabase"
import { onboardingAccountSchema, type OnboardingAccountInput } from "@/lib/validators"
import { useAuthStore } from "@/stores/auth-store"
import { formatCurrency } from "@/lib/formatters"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { Wallet, Building2, Smartphone, PiggyBank, TrendingUp, CircleDot } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AccountType } from "@/lib/constants"
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

export function OnboardingForm() {
  const navigate = useNavigate()
  const { profile, setProfile } = useAuthStore()
  const [error, setError] = useState("")

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingAccountInput>({
    resolver: zodResolver(onboardingAccountSchema),
    defaultValues: { name: "", type: "bank", initial_balance: "0" },
  })

  const selectedType = useWatch({ control, name: "type" })
  const initialBalance = useWatch({ control, name: "initial_balance" })

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

  const previewBalance = useMemo(() => {
    const n = parseIdrInteger(initialBalance ?? "")
    if (Number.isFinite(n)) {
      return formatCurrency(n)
    }
    return "Rp0"
  }, [initialBalance])

  async function onSubmit(data: OnboardingAccountInput) {
    if (!profile?.id) return

    try {
      setError("")

      const { error: accountError } = await supabase
        .from("accounts")
        .insert({
          user_id: profile.id,
          name: data.name,
          type: data.type,
          initial_balance: parseIdrInteger(data.initial_balance),
          balance: parseIdrInteger(data.initial_balance),
        })

      if (accountError) throw accountError

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", profile.id)

      if (profileError) throw profileError

      setProfile({ ...profile, onboarding_completed: true })
      navigate("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyelesaikan onboarding.")
    }
  }

  const datalistId = `account-name-presets-${selectedType}`
  const initialBalanceField = register("initial_balance")

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Setup Rekening</CardTitle>
          <CardDescription>
            Buat rekening pertamamu untuk mulai mengelola keuangan
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="flex flex-col gap-5">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nama Rekening</Label>
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
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label>Tipe Rekening</Label>
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
              {errors.type && (
                <p className="text-xs text-destructive">{errors.type.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="initial_balance">Saldo Awal</Label>
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
              {errors.initial_balance && (
                <p className="text-xs text-destructive">{errors.initial_balance.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full touch-target" disabled={isSubmitting}>
              {isSubmitting ? <LoadingSpinner size={18} /> : "Mulai Sekarang"}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}

import { useState } from "react"
import { useAuthStore } from "@/stores/auth-store"
import { supabase } from "@/services/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { LogOut, Calculator, Bell, BellRing } from "lucide-react"
import { toast } from "sonner"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import { useNavigate } from "react-router-dom"
import { BalanceRecalculationDialog } from "@/components/settings/BalanceRecalculationDialog"
import { useBalanceRecalculation } from "@/hooks/useBalanceRecalculation"
import type { BalanceRecalcSummary } from "@/types/financial"
import { formatErrorMessage } from "@/lib/format-error"

import { AppLockSettingsCard } from "@/components/security/AppLockSettingsCard"
const emptyRecalcSummary: BalanceRecalcSummary = {
  totalCount: 0,
  updateCount: 0,
  skipCount: 0,
  hasIssues: false,
  totalDifference: 0,
}

export default function SettingsPage() {
  const { reset, profile } = useAuthStore()
  const navigate = useNavigate()
  const [showRecalcDialog, setShowRecalcDialog] = useState(false)
  const [isSendingTest, setIsSendingTest] = useState(false)

  const {
    preview,
    isPreviewLoading,
    isPreviewError,
    previewError,
    summary,
    applyRecalculation,
    isApplying,
    applyError,
    refetchPreview,
  } = useBalanceRecalculation(profile?.id ?? "")

  const {
    isSupported,
    isSubscribed,
    isLoading: isPushLoading,
    isToggling: isPushToggling,
    error: pushError,
    toggleSubscription,
  } = usePushNotifications(profile?.id ?? "")
  const recalcSummary = summary ?? emptyRecalcSummary
  const recalcErrorMessage =
    previewError != null || applyError != null
      ? formatErrorMessage(previewError ?? applyError)
      : null

  const rpcMissingFallback =
    "Pastikan migrasi saldo (RPC) sudah diterapkan di project Supabase yang dipakai aplikasi."
  const previewLoadError = isPreviewError
    ? recalcErrorMessage ?? rpcMissingFallback
    : null

  async function handleToggleNotification(checked: boolean) {
    const success = await toggleSubscription(checked)
    if (success) {
      if (checked) {
        toast.success("Notifikasi push berhasil diaktifkan")
      } else {
        toast.success("Notifikasi push dinonaktifkan")
      }
    } else if (pushError) {
      toast.error(pushError)
    }
  }

  async function handleSendTestNotification() {
    setIsSendingTest(true)
    try {
      if (!("serviceWorker" in navigator)) {
        toast.error("Service worker tidak didukung di browser ini.")
        return
      }
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg) {
        await reg.showNotification("Tagihan Auto-Debit Berhasil", {
          body: "Pembayaran Tagihan Listrik PLN sebesar Rp 250.000 berhasil diproses.",
          icon: "/pwa-192x192.png",
          badge: "/pwa-192x192.png",
          data: { url: "/transactions" },
        })
        toast.success("Notifikasi uji coba dikirim ke status bar!")
      } else {
        toast.error("Service worker belum siap. Harap aktifkan notifikasi terlebih dahulu.")
      }
    } catch {
      toast.error("Gagal memunculkan notifikasi.")
    } finally {
      setIsSendingTest(false)
    }
  }
  async function handleLogout() {
    await supabase.auth.signOut()
    reset()
    navigate("/auth/login")
  }

  async function handleApplyRecalculation() {
    await applyRecalculation()
    setShowRecalcDialog(false)
  }

  function handleOpenDialog() {
    refetchPreview()
    setShowRecalcDialog(true)
  }

  function handleDialogChange(open: boolean) {
    if (isApplying && !open) return
    setShowRecalcDialog(open)
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Pengaturan</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Akun</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Profil dan detail akun dapat diakses dari ikon profil di pojok kanan atas.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell size={18} />
            Notifikasi
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Tagihan Auto-Debit</p>
              <p className="text-xs text-muted-foreground">
                Terima pemberitahuan push saat tagihan otomatis berhasil atau gagal diproses.
              </p>
            </div>
            <Switch
              checked={isSubscribed}
              disabled={isPushLoading || isPushToggling || (!isSupported && !isPushLoading)}
              onCheckedChange={handleToggleNotification}
              aria-label="Toggle notifikasi push"
            />
          </div>
          {isSubscribed && (
            <Button
              variant="outline"
              size="sm"
              className="touch-target mt-1 w-full"
              onClick={handleSendTestNotification}
              disabled={isSendingTest}
            >
              <BellRing size={16} className="mr-2" />
              {isSendingTest ? "Mengirim Notifikasi…" : "Kirim Notifikasi Uji Coba"}
            </Button>
          )}
          {!isSupported && !isPushLoading && (
            <p className="text-xs text-muted-foreground">
              Push notification tidak didukung pada browser atau perangkat ini.
            </p>
          )}

          {pushError && (
            <p className="text-xs text-destructive" role="alert">
              {pushError}
            </p>
          )}
        </CardContent>
      </Card>
      <AppLockSettingsCard />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Saldo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Hitung ulang saldo rekening dari riwayat transaksi jika terjadi ketidaksesuaian.
          </p>
          {(isPreviewError || applyError) && (
            <p className="mb-3 text-sm text-destructive" role="alert">
              {recalcErrorMessage ?? rpcMissingFallback}
            </p>
          )}
          <Button
            variant="outline"
            className="touch-target"
            onClick={handleOpenDialog}
            disabled={isPreviewLoading}
          >
            <Calculator size={18} className="mr-2" />
            {isPreviewLoading ? "Memuat…" : "Hitung Ulang Saldo"}
          </Button>
        </CardContent>
      </Card>

      <Button
        variant="outline"
        className="w-full touch-target text-destructive hover:text-destructive"
        onClick={handleLogout}
      >
        <LogOut size={18} className="mr-2" />
        Keluar
      </Button>

      <BalanceRecalculationDialog
        open={showRecalcDialog}
        onOpenChange={handleDialogChange}
        preview={preview}
        summary={recalcSummary}
        isApplying={isApplying}
        onApply={handleApplyRecalculation}
        loadError={previewLoadError}
      />
    </div>
  )
}

import { useState } from "react"
import { useAuthStore } from "@/stores/auth-store"
import { supabase } from "@/services/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogOut, Calculator } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { BalanceRecalculationDialog } from "@/components/settings/BalanceRecalculationDialog"
import { useBalanceRecalculation } from "@/hooks/useBalanceRecalculation"

export default function SettingsPage() {
  const { reset, profile } = useAuthStore()
  const navigate = useNavigate()
  const [showRecalcDialog, setShowRecalcDialog] = useState(false)

  const {
    preview,
    isPreviewLoading,
    summary,
    applyRecalculation,
    isApplying,
    refetchPreview,
  } = useBalanceRecalculation(profile?.id ?? "")

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
          <CardTitle className="text-base">Data Saldo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Hitung ulang saldo rekening dari riwayat transaksi jika terjadi ketidaksesuaian.
          </p>
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

      {summary && (
        <BalanceRecalculationDialog
          open={showRecalcDialog}
          onOpenChange={handleDialogChange}
          preview={preview}
          summary={summary}
          isApplying={isApplying}
          onApply={handleApplyRecalculation}
        />
      )}
    </div>
  )
}

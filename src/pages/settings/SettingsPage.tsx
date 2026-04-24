import { useAuthStore } from "@/stores/auth-store"
import { supabase } from "@/services/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function SettingsPage() {
  const { reset } = useAuthStore()
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    reset()
    navigate("/auth/login")
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

      <Button
        variant="outline"
        className="w-full touch-target text-destructive hover:text-destructive"
        onClick={handleLogout}
      >
        <LogOut size={18} className="mr-2" />
        Keluar
      </Button>
    </div>
  )
}

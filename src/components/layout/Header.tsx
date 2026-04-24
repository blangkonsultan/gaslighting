import { useAuthStore } from "@/stores/auth-store"
import { supabase } from "@/services/supabase"
import { LogOut, User, Settings } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useNavigate } from "react-router-dom"

export function Header() {
  const { profile, reset } = useAuthStore()
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    reset()
    navigate("/auth/login")
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:px-6">
      <h1 className="text-lg font-bold text-primary lg:hidden">Gaslighting</h1>

      <div className="ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center justify-center rounded-full bg-muted p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors touch-target">
            <User size={20} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {profile && (
              <>
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{profile.full_name || profile.email}</p>
                  <p className="text-xs text-muted-foreground">{profile.email}</p>
                </div>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings size={16} className="mr-2" />
              Pengaturan
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
              <LogOut size={16} className="mr-2" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

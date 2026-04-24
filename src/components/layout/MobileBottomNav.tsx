import { useState } from "react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  FileBarChart,
  MoreHorizontal,
  Tag,
  ListChecks,
  FileText,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth-store"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

const userNavItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/accounts", icon: Wallet, label: "Rekening" },
  { to: "/transactions", icon: ArrowLeftRight, label: "Transaksi" },
  { to: "/reports", icon: FileBarChart, label: "Laporan" },
]

const adminNavItems = [
  { to: "/admin/categories", icon: Tag, label: "Kategori" },
  { to: "/admin/account-presets", icon: ListChecks, label: "Preset" },
]

export function MobileBottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const isAdmin = profile?.role === "admin"
  const items = isAdmin ? adminNavItems : userNavItems
  const [open, setOpen] = useState(false)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card lg:hidden">
      <div className="flex items-stretch justify-around"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {items.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname.startsWith(to)
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors",
                "touch-target",
                isActive
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span>{label}</span>
            </NavLink>
          )
        })}

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <button
                type="button"
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors touch-target",
                  location.pathname.startsWith("/settings") || location.pathname.startsWith("/bills")
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Lainnya"
              >
                <MoreHorizontal size={22} strokeWidth={2} />
                <span>Lainnya</span>
              </button>
            }
          />

          <SheetContent side="bottom" className="p-0">
            <SheetHeader className="px-4 pb-2 pt-4">
              <SheetTitle>Lainnya</SheetTitle>
            </SheetHeader>

            <div className="px-4 pb-6">
              <div className="grid gap-2">
                <Button
                  variant="outline"
                  className="touch-target justify-start"
                  onClick={() => {
                    setOpen(false)
                    navigate("/bills")
                  }}
                >
                  <FileText size={18} className="mr-2" />
                  Tagihan (Auto-Debit)
                </Button>

                <Button
                  variant="outline"
                  className="touch-target justify-start"
                  onClick={() => {
                    setOpen(false)
                    navigate("/settings")
                  }}
                >
                  <Settings size={18} className="mr-2" />
                  Pengaturan
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}

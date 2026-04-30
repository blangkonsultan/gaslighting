import { NavLink, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  FileBarChart,
  Settings,
  Receipt,
  Tag,
  ListChecks,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { useAuthStore } from "@/stores/auth-store"

const userMainNav = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/accounts", icon: Wallet, label: "Rekening" },
  { to: "/transactions/new", icon: ArrowLeftRight, label: "Transaksi Baru" },
  { to: "/transactions", icon: FileBarChart, label: "Riwayat" },
  { to: "/bills", icon: Receipt, label: "Tagihan" },
]

const userBottomNav = [
  { to: "/reports", icon: FileBarChart, label: "Laporan" },
  { to: "/settings", icon: Settings, label: "Pengaturan" },
]

const adminNav = [
  { to: "/admin/categories", icon: Tag, label: "Kelola Kategori" },
  { to: "/admin/account-presets", icon: ListChecks, label: "Kelola Preset Rekening" },
  { to: "/settings", icon: Settings, label: "Pengaturan" },
]

export function DesktopSidebar() {
  const location = useLocation()
  const { profile } = useAuthStore()
  const isAdmin = profile?.role === "admin"

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-border lg:bg-card">
      <div className="flex h-14 items-center px-6">
        <h1 className="text-lg font-bold text-primary">Gaslighting</h1>
      </div>
      <Separator />

      {isAdmin ? (
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {adminNav.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to || location.pathname.startsWith(to)
            return (
              <NavLink
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon size={20} />
                <span>{label}</span>
              </NavLink>
            )
          })}
        </nav>
      ) : (
        <>
          <nav className="flex flex-1 flex-col gap-1 p-3">
            {userMainNav.map(({ to, icon: Icon, label }) => {
              let isActive = false
              if (to === "/transactions/new") {
                isActive = location.pathname === to
              } else if (to === "/transactions") {
                isActive = location.pathname === to || location.pathname.startsWith("/transactions/")
              } else if (to === "/dashboard") {
                isActive = location.pathname === to
              } else {
                isActive = location.pathname.startsWith(to)
              }
              return (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/transactions/new"}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon size={20} />
                  <span>{label}</span>
                </NavLink>
              )
            })}
          </nav>
          <Separator />
          <nav className="flex flex-col gap-1 p-3">
            {userBottomNav.map(({ to, icon: Icon, label }) => {
              const isActive = location.pathname === to || location.pathname.startsWith(to)
              return (
                <NavLink
                  key={to}
                  to={to}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon size={20} />
                  <span>{label}</span>
                </NavLink>
              )
            })}
          </nav>
        </>
      )}
    </aside>
  )
}

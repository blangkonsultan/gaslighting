import { NavLink, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  FileBarChart,
  History,
  Settings,
  Receipt,
  Tag,
  ListChecks,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { useAuthStore } from "@/stores/auth-store"
import { AppLogo } from "@/components/shared/AppLogo"
import { t } from "@/lib/i18n"

const userMainNav = [
  { to: "/dashboard", icon: LayoutDashboard, label: t.nav_dashboard },
  { to: "/accounts", icon: Wallet, label: t.nav_accounts },
  { to: "/transactions/new", icon: ArrowLeftRight, label: t.nav_new_transaction },
  { to: "/transactions", icon: History, label: t.nav_history },
  { to: "/bills", icon: Receipt, label: t.nav_bills },
]

const userBottomNav = [
  { to: "/reports", icon: FileBarChart, label: t.nav_reports },
  { to: "/settings", icon: Settings, label: t.nav_settings },
]

const adminNav = [
  { to: "/dashboard", icon: LayoutDashboard, label: t.nav_dashboard },
  { to: "/admin/categories", icon: Tag, label: t.nav_manage_categories },
  { to: "/admin/account-presets", icon: ListChecks, label: t.nav_manage_account_presets },
]

export function DesktopSidebar() {
  const location = useLocation()
  const { profile } = useAuthStore()
  const isAdmin = profile?.role === "admin"

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-border lg:bg-card">
      <div className="flex h-14 items-center px-6">
        <AppLogo size="md" showText />
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
              const isActive =
                to === "/transactions/new"
                  ? location.pathname === to
                  : to === "/transactions"
                    ? location.pathname === to || (location.pathname.startsWith("/transactions/") && location.pathname !== "/transactions/new")
                    : to === "/dashboard"
                      ? location.pathname === to
                      : location.pathname.startsWith(to)
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

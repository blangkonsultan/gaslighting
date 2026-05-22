import DashboardPage from "@/pages/dashboard/DashboardPage"
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage"
import { useAuthStore } from "@/stores/auth-store"

export function RoleDashboard() {
  const { profile } = useAuthStore()
  const isAdmin = profile?.role === "admin"

  return isAdmin ? <AdminDashboardPage /> : <DashboardPage />
}
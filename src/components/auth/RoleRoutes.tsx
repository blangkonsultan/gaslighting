import { Navigate, Outlet } from "react-router-dom"
import { useAuthStore } from "@/stores/auth-store"
import { PageLoading } from "@/components/shared/LoadingSpinner"

export function ProtectedRoute() {
  const { profile, isLoading } = useAuthStore()

  if (isLoading) return <PageLoading />
  if (!profile) return <Navigate to="/auth/login" replace />

  return <Outlet />
}

/**
 * Dashboard is available for both roles:
 * - **admin**: allowed (no onboarding requirement)
 * - **user**: must complete onboarding first
 */
export function DashboardRoute() {
  const { profile, isLoading } = useAuthStore()

  if (isLoading) return <PageLoading />
  if (!profile) return <Navigate to="/auth/login" replace />
  if (profile.role !== "admin" && !profile.onboarding_completed) {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}

export function UserRoute() {
  const { profile, isLoading } = useAuthStore()

  if (isLoading) return <PageLoading />
  if (!profile) return <Navigate to="/auth/login" replace />
  if (profile.role === "admin") return <Navigate to="/admin/categories" replace />
  if (!profile.onboarding_completed) return <Navigate to="/onboarding" replace />

  return <Outlet />
}

export function AdminRoute() {
  const { profile, isLoading } = useAuthStore()

  if (isLoading) return <PageLoading />
  if (!profile) return <Navigate to="/auth/login" replace />
  if (profile.role !== "admin") return <Navigate to="/dashboard" replace />

  return <Outlet />
}

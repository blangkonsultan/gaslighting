import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuthStore } from "@/stores/auth-store"
import { PageLoading } from "@/components/shared/LoadingSpinner"

function toLoginWithNext(next: string) {
  return `/auth/login?next=${encodeURIComponent(next)}`
}

function useNextPath() {
  const location = useLocation()
  return `${location.pathname}${location.search}${location.hash}`
}

function postAuthDestination(profile: NonNullable<ReturnType<typeof useAuthStore.getState>["profile"]>) {
  if (profile.role === "admin") return "/admin/categories"
  if (!profile.onboarding_completed) return "/onboarding"
  return "/dashboard"
}

export function GuestRoute() {
  const { profile, isLoading } = useAuthStore()

  if (isLoading) return <PageLoading />
  if (profile) return <Navigate to={postAuthDestination(profile)} replace />

  return <Outlet />
}

export function ProtectedRoute() {
  const { profile, isLoading } = useAuthStore()
  const next = useNextPath()

  if (isLoading) return <PageLoading />
  if (!profile) return <Navigate to={toLoginWithNext(next)} replace />

  return <Outlet />
}

/**
 * Dashboard is available for both roles:
 * - **admin**: allowed (no onboarding requirement)
 * - **user**: must complete onboarding first
 */
export function DashboardRoute() {
  const { profile, isLoading } = useAuthStore()
  const next = useNextPath()

  if (isLoading) return <PageLoading />
  if (!profile) return <Navigate to={toLoginWithNext(next)} replace />
  if (profile.role !== "admin" && !profile.onboarding_completed) {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}

export function UserRoute() {
  const { profile, isLoading } = useAuthStore()
  const next = useNextPath()

  if (isLoading) return <PageLoading />
  if (!profile) return <Navigate to={toLoginWithNext(next)} replace />
  if (profile.role === "admin") return <Navigate to="/admin/categories" replace />
  if (!profile.onboarding_completed) return <Navigate to="/onboarding" replace />

  return <Outlet />
}

export function AdminRoute() {
  const { profile, isLoading } = useAuthStore()
  const next = useNextPath()

  if (isLoading) return <PageLoading />
  if (!profile) return <Navigate to={toLoginWithNext(next)} replace />
  if (profile.role !== "admin") return <Navigate to="/dashboard" replace />

  return <Outlet />
}

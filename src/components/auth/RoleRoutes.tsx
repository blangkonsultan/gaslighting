import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuthStore } from "@/stores/auth-store"
import { PageLoading } from "@/components/shared/LoadingSpinner"
import { postAuthDestination } from "@/lib/auth-utils"

function toLoginWithNext(next: string) {
  return `/auth/login?next=${encodeURIComponent(next)}`
}

function useNextPath() {
  const location = useLocation()
  return `${location.pathname}${location.search}${location.hash}`
}

export function GuestRoute() {
  const { sessionUserId, profile, isLoading } = useAuthStore()

  if (isLoading) return <PageLoading />
  if (sessionUserId && !profile) return <PageLoading />
  if (profile) return <Navigate to={postAuthDestination(profile)} replace />

  return <Outlet />
}

export function ProtectedRoute() {
  const { sessionUserId, profile, isLoading } = useAuthStore()
  const next = useNextPath()

  if (isLoading) return <PageLoading />
  if (!sessionUserId) return <Navigate to={toLoginWithNext(next)} replace />
  if (!profile) return <PageLoading />

  return <Outlet />
}

/**
 * Dashboard is available for both roles:
 * - **admin**: allowed (no onboarding requirement)
 * - **user**: must complete onboarding first
 */
export function DashboardRoute() {
  const { sessionUserId, profile, isLoading } = useAuthStore()
  const next = useNextPath()

  if (isLoading) return <PageLoading />
  if (!sessionUserId) return <Navigate to={toLoginWithNext(next)} replace />
  if (!profile) return <PageLoading />
  if (profile.role !== "admin" && !profile.onboarding_completed) {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}

export function UserRoute() {
  const { sessionUserId, profile, isLoading } = useAuthStore()
  const next = useNextPath()

  if (isLoading) return <PageLoading />
  if (!sessionUserId) return <Navigate to={toLoginWithNext(next)} replace />
  if (!profile) return <PageLoading />
  if (profile.role === "admin") return <Navigate to="/admin/categories" replace />
  if (!profile.onboarding_completed) return <Navigate to="/onboarding" replace />

  return <Outlet />
}

export function AdminRoute() {
  const { sessionUserId, profile, isLoading } = useAuthStore()
  const next = useNextPath()

  if (isLoading) return <PageLoading />
  if (!sessionUserId) return <Navigate to={toLoginWithNext(next)} replace />
  if (!profile) return <PageLoading />
  if (profile.role !== "admin") return <Navigate to="/dashboard" replace />

  return <Outlet />
}

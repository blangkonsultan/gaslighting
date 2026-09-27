import { lazy, Suspense, useEffect } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "@/components/ui/sonner"
import { useAuth } from "@/hooks/useAuth"
import { queryClient } from "@/lib/query-client"
import { AppShell } from "@/components/layout/AppShell"
import { UserRoute, AdminRoute, DashboardRoute, GuestRoute } from "@/components/auth/RoleRoutes"
import { PageLoading } from "@/components/shared/LoadingSpinner"
import { AppLockScreen } from "@/components/security/AppLockScreen"
import { setupAppLockAutoLockListeners } from "@/stores/app-lock-store"

const LoginPage = lazy(() => import("@/pages/auth/LoginPage"))
const RegisterPage = lazy(() => import("@/pages/auth/RegisterPage"))
const OnboardingPage = lazy(() => import("@/pages/onboarding/OnboardingPage"))
const RoleDashboard = lazy(() => import("@/components/auth/RoleDashboard").then((m) => ({ default: m.RoleDashboard })))
const AccountsListPage = lazy(() => import("@/pages/accounts/AccountsListPage"))
const AccountCreatePage = lazy(() => import("@/pages/accounts/AccountCreatePage"))
const TransactionListPage = lazy(() => import("@/pages/transactions/TransactionListPage"))
const TransactionCreatePage = lazy(() => import("@/pages/transactions/TransactionCreatePage"))
const TransactionEditPage = lazy(() => import("@/pages/transactions/TransactionEditPage"))
const ReportsPage = lazy(() => import("@/pages/reports/ReportsPage"))
const SettingsPage = lazy(() => import("@/pages/settings/SettingsPage"))
const AdminCategoriesPage = lazy(() => import("@/pages/admin/AdminCategoriesPage"))
const AdminAccountPresetsPage = lazy(() => import("@/pages/admin/AdminAccountPresetsPage"))
const BillsPage = lazy(() => import("@/pages/bills/BillsPage"))
const TemplatesPage = lazy(() => import("@/pages/templates/TemplatesPage"))
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"))

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth()
  if (isLoading) return <PageLoading />
  return <>{children}</>
}

export default function App() {
  useEffect(() => {
    const cleanup = setupAppLockAutoLockListeners()
    return cleanup
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthInitializer>
          <Suspense fallback={<PageLoading />}>
            <Routes>
              <Route element={<GuestRoute />}>
                <Route path="/auth/login" element={<LoginPage />} />
                <Route path="/auth/register" element={<RegisterPage />} />
              </Route>
              <Route path="/onboarding" element={<OnboardingPage />} />

              {/* Dashboard — shared with role-based content */}
              <Route element={<DashboardRoute />}>
                <Route element={<AppShell />}>
                  <Route path="dashboard" element={<RoleDashboard />} />
                </Route>
              </Route>

              {/* User routes — admin redirected to /admin/categories */}
              <Route element={<UserRoute />}>
                <Route element={<AppShell />}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="accounts" element={<AccountsListPage />} />
                  <Route path="accounts/new" element={<AccountCreatePage />} />
                  <Route path="transactions" element={<TransactionListPage />} />
                  <Route path="transactions/new" element={<TransactionCreatePage />} />
                  <Route path="transactions/:id/edit" element={<TransactionEditPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="bills" element={<BillsPage />} />
                  <Route path="templates" element={<TemplatesPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
              </Route>

              {/* Admin routes — regular users redirected to /dashboard */}
              <Route element={<AdminRoute />}>
                <Route element={<AppShell />}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="admin/categories" element={<AdminCategoriesPage />} />
                  <Route path="admin/account-presets" element={<AdminAccountPresetsPage />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </AuthInitializer>
        <Toaster position="top-center" richColors />
        <AppLockScreen />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

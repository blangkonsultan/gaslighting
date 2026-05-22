import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "@/components/ui/sonner"
import { useAuth } from "@/hooks/useAuth"
import { queryClient } from "@/lib/query-client"
import { AppShell } from "@/components/layout/AppShell"
import { UserRoute, AdminRoute, DashboardRoute, GuestRoute } from "@/components/auth/RoleRoutes"
import { PageLoading } from "@/components/shared/LoadingSpinner"
import LoginPage from "@/pages/auth/LoginPage"
import RegisterPage from "@/pages/auth/RegisterPage"
import OnboardingPage from "@/pages/onboarding/OnboardingPage"
import { RoleDashboard } from "@/components/auth/RoleDashboard"
import AccountsListPage from "@/pages/accounts/AccountsListPage"
import AccountCreatePage from "@/pages/accounts/AccountCreatePage"
import TransactionListPage from "@/pages/transactions/TransactionListPage"
import TransactionCreatePage from "@/pages/transactions/TransactionCreatePage"
import TransactionEditPage from "@/pages/transactions/TransactionEditPage"
import ReportsPage from "@/pages/reports/ReportsPage"
import SettingsPage from "@/pages/settings/SettingsPage"
import AdminCategoriesPage from "@/pages/admin/AdminCategoriesPage"
import AdminAccountPresetsPage from "@/pages/admin/AdminAccountPresetsPage"
import BillsPage from "@/pages/bills/BillsPage"
import NotFoundPage from "@/pages/NotFoundPage"

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth()
  if (isLoading) return <PageLoading />
  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthInitializer>
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
        </AuthInitializer>
        <Toaster position="top-center" richColors />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

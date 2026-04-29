import { describe, expect, it, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { GuestRoute } from "@/components/auth/RoleRoutes"
import { useAuthStore } from "@/stores/auth-store"
import type { Profile } from "@/types/financial"

function renderWithRoutes(initialEntry: string) {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/auth/login" element={<div>Login</div>} />
          <Route path="/auth/register" element={<div>Register</div>} />
        </Route>

        <Route path="/dashboard" element={<div>Dashboard</div>} />
        <Route path="/onboarding" element={<div>Onboarding</div>} />
        <Route path="/admin/categories" element={<div>AdminCategories</div>} />
      </Routes>
    </MemoryRouter>
  )
}

function setProfile(profile: Profile | null) {
  useAuthStore.setState({ sessionUserId: profile ? "user-1" : null, profile, isLoading: false, hydrated: true })
}

beforeEach(() => {
  useAuthStore.setState({ sessionUserId: null, profile: null, isLoading: false, hydrated: true })
})

describe("GuestRoute", () => {
  it("allows guests to access /auth/login", () => {
    setProfile(null)
    renderWithRoutes("/auth/login")
    expect(screen.getByText("Login")).toBeInTheDocument()
  })

  it("redirects admin to /admin/categories", () => {
    setProfile({ role: "admin", onboarding_completed: true } as unknown as Profile)
    renderWithRoutes("/auth/login")
    expect(screen.getByText("AdminCategories")).toBeInTheDocument()
  })

  it("redirects non-admin not onboarded to /onboarding", () => {
    setProfile({ role: "user", onboarding_completed: false } as unknown as Profile)
    renderWithRoutes("/auth/register")
    expect(screen.getByText("Onboarding")).toBeInTheDocument()
  })

  it("redirects non-admin onboarded to /dashboard", () => {
    setProfile({ role: "user", onboarding_completed: true } as unknown as Profile)
    renderWithRoutes("/auth/register")
    expect(screen.getByText("Dashboard")).toBeInTheDocument()
  })

  it("does not show auth pages while session exists but profile is still loading", () => {
    useAuthStore.setState({ sessionUserId: "user-1", profile: null, isLoading: false })
    renderWithRoutes("/auth/login")
    expect(screen.queryByText("Login")).not.toBeInTheDocument()
  })
})


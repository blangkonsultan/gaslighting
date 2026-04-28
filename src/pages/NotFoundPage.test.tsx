import { describe, expect, it, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import NotFoundPage from "@/pages/NotFoundPage"
import { useAuthStore } from "@/stores/auth-store"
import type { Profile } from "@/types/financial"

function setProfile(profile: Profile | null) {
  useAuthStore.setState({ profile, isLoading: false })
}

beforeEach(() => {
  useAuthStore.setState({ profile: null, isLoading: false })
})

describe("NotFoundPage", () => {
  it("renders 404 for unknown routes", () => {
    render(
      <MemoryRouter initialEntries={["/this-does-not-exist"]}>
        <Routes>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText("404")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Page not found" })).toBeInTheDocument()
  })

  it("CTA sends guest to /auth/login", () => {
    setProfile(null)
    render(
      <MemoryRouter initialEntries={["/nope"]}>
        <Routes>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </MemoryRouter>
    )

    const link = screen.getByRole("link", { name: "Go to login" })
    expect(link).toHaveAttribute("href", "/auth/login")
  })

  it("CTA sends admin to /admin/categories", () => {
    setProfile({ role: "admin", onboarding_completed: true } as unknown as Profile)
    render(
      <MemoryRouter initialEntries={["/nope"]}>
        <Routes>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </MemoryRouter>
    )

    const link = screen.getByRole("link", { name: "Go to dashboard" })
    expect(link).toHaveAttribute("href", "/admin/categories")
  })
})


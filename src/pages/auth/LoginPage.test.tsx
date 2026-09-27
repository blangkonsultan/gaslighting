import { describe, expect, it, beforeEach, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import LoginPage from "./LoginPage"
import * as authService from "@/services/auth.service"

const mockNavigate = vi.fn()
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe("LoginPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockNavigate.mockReset()
  })

  it("renders branding, inputs, and submit button", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    expect(screen.getByRole("heading", { name: "Gaslighting", level: 1 })).toBeInTheDocument()
    expect(screen.getByText("Selamat Datang Kembali")).toBeInTheDocument()
    expect(screen.getByLabelText("Email")).toBeInTheDocument()
    expect(screen.getByLabelText("Password")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Masuk ke Akun/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Daftar sekarang" })).toBeInTheDocument()
  })

  it("toggles password visibility when eye button clicked", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    const passwordInput = screen.getByLabelText("Password")
    expect(passwordInput).toHaveAttribute("type", "password")

    const toggleBtn = screen.getByRole("button", { name: "Tampilkan password" })
    fireEvent.click(toggleBtn)

    expect(passwordInput).toHaveAttribute("type", "text")
    expect(screen.getByRole("button", { name: "Sembunyikan password" })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Sembunyikan password" }))
    expect(passwordInput).toHaveAttribute("type", "password")
  })

  it("submits form and navigates on success", async () => {
    vi.spyOn(authService, "login").mockResolvedValue({
      user: { id: "u-1" },
      session: { access_token: "tok" },
    } as unknown as Awaited<ReturnType<typeof authService.login>>)

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } })
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } })

    fireEvent.click(screen.getByRole("button", { name: /Masuk ke Akun/i }))

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      })
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard")
    })
  })

  it("displays error alert when login fails", async () => {
    vi.spyOn(authService, "login").mockRejectedValue(new Error("Email atau password salah."))

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "wrong@example.com" } })
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "wrongpass" } })

    fireEvent.click(screen.getByRole("button", { name: /Masuk ke Akun/i }))

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Email atau password salah.")
    })
  })

  it("displays success banner when verified=true is in search query", () => {
    render(
      <MemoryRouter initialEntries={["/auth/login?verified=true"]}>
        <LoginPage />
      </MemoryRouter>
    )

    expect(screen.getByRole("status")).toHaveTextContent(
      "Akun Anda telah berhasil diverifikasi! Silakan masuk dengan email dan password."
    )
  })
})

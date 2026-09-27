import { describe, expect, it, beforeEach, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { AppLockScreen } from "./AppLockScreen"
import { useAppLockStore } from "@/stores/app-lock-store"
import { useAuthStore } from "@/stores/auth-store"
import { supabase } from "@/services/supabase"

describe("AppLockScreen", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    useAuthStore.setState({ sessionUserId: "user-123" })
    useAppLockStore.setState({
      isLocked: true,
      isEnabled: true,
      isBiometricsEnabled: false,
      timeoutMinutes: 0,
      hasPin: true,
    })
  })

  it("renders nothing when isLocked is false", () => {
    useAppLockStore.setState({ isLocked: false })
    const { container } = render(<AppLockScreen />)
    expect(container).toBeEmptyDOMElement()
  })

  it("renders nothing when sessionUserId is null even if isLocked is true", () => {
    useAuthStore.setState({ sessionUserId: null })
    const { container } = render(<AppLockScreen />)
    expect(container).toBeEmptyDOMElement()
  })

  it("renders lock screen when isLocked is true", () => {
    render(<AppLockScreen />)
    expect(screen.getByRole("dialog", { name: "Kunci Aplikasi" })).toBeInTheDocument()
    expect(screen.getByText("Gaslighting")).toBeInTheDocument()
    expect(screen.getByText("Masukkan 6 digit PIN")).toBeInTheDocument()
    expect(screen.getByTestId("keypad-1")).toBeInTheDocument()
    expect(screen.getByTestId("keypad-9")).toBeInTheDocument()
    expect(screen.getByTestId("keypad-0")).toBeInTheDocument()
    expect(screen.getByTestId("keypad-delete")).toBeInTheDocument()
  })

  it("enters 6 digits and unlocks when correct PIN is entered", async () => {
    const unlockSpy = vi.fn().mockResolvedValue(true)
    useAppLockStore.setState({ unlockWithPin: unlockSpy })

    render(<AppLockScreen />)

    for (let i = 1; i <= 6; i++) {
      fireEvent.click(screen.getByTestId(`keypad-${i}`))
    }

    await waitFor(() => {
      expect(unlockSpy).toHaveBeenCalledWith("123456")
    })
  })

  it("displays error message and resets dots when incorrect PIN is entered", async () => {
    const unlockSpy = vi.fn().mockResolvedValue(false)
    useAppLockStore.setState({ unlockWithPin: unlockSpy })

    render(<AppLockScreen />)

    for (let i = 1; i <= 6; i++) {
      fireEvent.click(screen.getByTestId(`keypad-${i}`))
    }

    await waitFor(() => {
      expect(screen.getByText("PIN salah. Silakan coba lagi.")).toBeInTheDocument()
    })
  })

  it("deletes digits when backspace keypad is clicked", () => {
    render(<AppLockScreen />)

    fireEvent.click(screen.getByTestId("keypad-5"))
    const dot0 = screen.getByTestId("pin-dot-0")
    expect(dot0).toHaveClass("bg-[#9AB17A]")

    fireEvent.click(screen.getByTestId("keypad-delete"))
    expect(dot0).not.toHaveClass("bg-[#9AB17A]")
  })

  it("supports physical keyboard input", async () => {
    const unlockSpy = vi.fn().mockResolvedValue(true)
    useAppLockStore.setState({ unlockWithPin: unlockSpy })

    render(<AppLockScreen />)

    for (let i = 1; i <= 6; i++) {
      fireEvent.keyDown(window, { key: String(i) })
    }

    await waitFor(() => {
      expect(unlockSpy).toHaveBeenCalledWith("123456")
    })
  })

  it("triggers biometric unlock button when biometrics is enabled", async () => {
    const bioSpy = vi.fn().mockResolvedValue(true)
    useAppLockStore.setState({ isBiometricsEnabled: true, unlockWithBiometrics: bioSpy })

    render(<AppLockScreen />)

    const bioBtn = screen.getByTestId("keypad-biometrics")
    expect(bioBtn).toBeInTheDocument()

    fireEvent.click(bioBtn)
    await waitFor(() => {
      expect(bioSpy).toHaveBeenCalled()
    })
  })

  it("opens logout confirmation dialog when forgot PIN clicked", async () => {
    const signOutSpy = vi.spyOn(supabase.auth, "signOut").mockResolvedValue({ error: null })
    const resetSpy = vi.fn()
    useAuthStore.setState({ reset: resetSpy })

    render(<AppLockScreen />)

    const forgotBtn = screen.getByRole("button", { name: /Lupa PIN\? Keluar Akun/i })
    fireEvent.click(forgotBtn)

    expect(screen.getByText("Keluar dari Akun?")).toBeInTheDocument()

    const confirmBtn = screen.getByRole("button", { name: "Ya, Keluar Akun" })
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(signOutSpy).toHaveBeenCalled()
      expect(resetSpy).toHaveBeenCalled()
    })
  })
})

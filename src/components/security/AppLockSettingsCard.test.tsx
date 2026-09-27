import { describe, expect, it, beforeEach, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { AppLockSettingsCard } from "./AppLockSettingsCard"
import { useAppLockStore } from "@/stores/app-lock-store"
import * as appLockModule from "@/lib/app-lock"

describe("AppLockSettingsCard", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    useAppLockStore.setState({
      isLocked: false,
      isEnabled: false,
      isBiometricsEnabled: false,
      timeoutMinutes: 0,
      hasPin: false,
    })
  })

  it("renders when app lock is disabled", () => {
    render(<AppLockSettingsCard />)
    expect(screen.getByText("Keamanan Aplikasi")).toBeInTheDocument()
    expect(screen.getByText("Kunci Layar (PIN / Biometrik)")).toBeInTheDocument()
    const switchEl = screen.getByRole("switch", { name: "Toggle kunci layar" })
    expect(switchEl).not.toBeChecked()
  })

  it("opens setup PIN dialog when switch is toggled on", () => {
    render(<AppLockSettingsCard />)
    const switchEl = screen.getByRole("switch", { name: "Toggle kunci layar" })
    fireEvent.click(switchEl)

    expect(screen.getByText("Atur 6 Digit PIN Keamanan")).toBeInTheDocument()
    expect(screen.getByTestId("setup-pin-input")).toBeInTheDocument()
    expect(screen.getByTestId("setup-pin-confirm-input")).toBeInTheDocument()
  })

  it("shows validation error if PINs do not match", async () => {
    render(<AppLockSettingsCard />)
    fireEvent.click(screen.getByRole("switch", { name: "Toggle kunci layar" }))

    const pinInput = screen.getByTestId("setup-pin-input")
    const confirmInput = screen.getByTestId("setup-pin-confirm-input")

    fireEvent.change(pinInput, { target: { value: "123456" } })
    fireEvent.change(confirmInput, { target: { value: "654321" } })

    const saveBtn = screen.getByRole("button", { name: "Simpan & Aktifkan" })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(screen.getByText("Konfirmasi PIN tidak cocok.")).toBeInTheDocument()
    })
  })

  it("successfully sets up PIN and activates lock", async () => {
    const setupPinSpy = vi.spyOn(appLockModule, "setupPin").mockResolvedValue(undefined)

    render(<AppLockSettingsCard />)
    fireEvent.click(screen.getByRole("switch", { name: "Toggle kunci layar" }))

    const pinInput = screen.getByTestId("setup-pin-input")
    const confirmInput = screen.getByTestId("setup-pin-confirm-input")

    fireEvent.change(pinInput, { target: { value: "123456" } })
    fireEvent.change(confirmInput, { target: { value: "123456" } })

    const saveBtn = screen.getByRole("button", { name: "Simpan & Aktifkan" })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(setupPinSpy).toHaveBeenCalledWith("123456")
    })
  })

  it("renders configuration options when lock is enabled", () => {
    useAppLockStore.setState({ isEnabled: true, hasPin: true })

    render(<AppLockSettingsCard />)

    expect(screen.getByText("Kunci Otomatis")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Ubah PIN/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Kunci Sekarang/i })).toBeInTheDocument()
  })

  it("triggers lockApp when Kunci Sekarang clicked", () => {
    const lockAppSpy = vi.fn()
    useAppLockStore.setState({ isEnabled: true, hasPin: true, lockApp: lockAppSpy })

    render(<AppLockSettingsCard />)

    const lockBtn = screen.getByRole("button", { name: /Kunci Sekarang/i })
    fireEvent.click(lockBtn)

    expect(lockAppSpy).toHaveBeenCalled()
  })

  it("opens disable confirmation and disables lock when confirmed", async () => {
    const disableLockSpy = vi.fn()
    useAppLockStore.setState({ isEnabled: true, hasPin: true, disableLock: disableLockSpy })

    render(<AppLockSettingsCard />)

    const switchEl = screen.getByRole("switch", { name: "Toggle kunci layar" })
    fireEvent.click(switchEl)

    expect(screen.getByText("Nonaktifkan Kunci Aplikasi?")).toBeInTheDocument()

    const confirmBtn = screen.getByRole("button", { name: "Ya, Nonaktifkan" })
    fireEvent.click(confirmBtn)

    expect(disableLockSpy).toHaveBeenCalled()
  })
})

import { describe, expect, it, beforeEach, vi } from "vitest"
import { useAppLockStore, setupAppLockAutoLockListeners } from "./app-lock-store"
import * as appLockModule from "@/lib/app-lock"

describe("app-lock-store", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    useAppLockStore.setState({
      isLocked: false,
      isEnabled: false,
      isBiometricsEnabled: false,
      timeoutMinutes: 0,
      hasPin: false,
    })
  })

  it("unlocks with correct PIN", async () => {
    vi.spyOn(appLockModule, "verifyPin").mockResolvedValue(true)
    useAppLockStore.setState({ isLocked: true, isEnabled: true, hasPin: true })

    const success = await useAppLockStore.getState().unlockWithPin("123456")
    expect(success).toBe(true)
    expect(useAppLockStore.getState().isLocked).toBe(false)
  })

  it("fails to unlock with incorrect PIN", async () => {
    vi.spyOn(appLockModule, "verifyPin").mockResolvedValue(false)
    useAppLockStore.setState({ isLocked: true, isEnabled: true, hasPin: true })

    const success = await useAppLockStore.getState().unlockWithPin("000000")
    expect(success).toBe(false)
    expect(useAppLockStore.getState().isLocked).toBe(true)
  })

  it("unlocks with biometrics", async () => {
    vi.spyOn(appLockModule, "verifyBiometrics").mockResolvedValue(true)
    useAppLockStore.setState({ isLocked: true, isEnabled: true, isBiometricsEnabled: true })

    const success = await useAppLockStore.getState().unlockWithBiometrics()
    expect(success).toBe(true)
    expect(useAppLockStore.getState().isLocked).toBe(false)
  })

  it("locks app if lock is enabled", () => {
    useAppLockStore.setState({ isLocked: false, isEnabled: true })
    useAppLockStore.getState().lockApp()
    expect(useAppLockStore.getState().isLocked).toBe(true)
  })

  it("does not lock app if lock is disabled", () => {
    useAppLockStore.setState({ isLocked: false, isEnabled: false })
    useAppLockStore.getState().lockApp()
    expect(useAppLockStore.getState().isLocked).toBe(false)
  })

  it("disables lock and resets state", () => {
    const removeSpy = vi.spyOn(appLockModule, "removeAppLock")
    useAppLockStore.setState({ isLocked: true, isEnabled: true, isBiometricsEnabled: true, hasPin: true })

    useAppLockStore.getState().disableLock()
    expect(removeSpy).toHaveBeenCalled()
    expect(useAppLockStore.getState().isEnabled).toBe(false)
    expect(useAppLockStore.getState().isLocked).toBe(false)
    expect(useAppLockStore.getState().hasPin).toBe(false)
  })

  it("auto-locks on visibilitychange if shouldAutoLock is true", () => {
    vi.spyOn(appLockModule, "shouldAutoLock").mockReturnValue(true)
    useAppLockStore.setState({ isLocked: false, isEnabled: true })

    const cleanup = setupAppLockAutoLockListeners()

    Object.defineProperty(document, "visibilityState", {
      value: "visible",
      configurable: true,
    })

    document.dispatchEvent(new Event("visibilitychange"))

    expect(useAppLockStore.getState().isLocked).toBe(true)
    cleanup()
  })
})

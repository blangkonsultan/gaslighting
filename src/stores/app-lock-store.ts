import { create } from "zustand"
import {
  isAppLockEnabled,
  hasPinConfigured,
  isBiometricsEnabled,
  getAutoLockTimeout,
  verifyPin,
  verifyBiometrics,
  setLastActiveTimestamp,
  shouldAutoLock,
  removeAppLock,
} from "@/lib/app-lock"

export interface AppLockState {
  isLocked: boolean
  isEnabled: boolean
  isBiometricsEnabled: boolean
  timeoutMinutes: number
  hasPin: boolean

  unlockWithPin: (pin: string) => Promise<boolean>
  unlockWithBiometrics: () => Promise<boolean>
  lockApp: () => void
  refreshLockState: () => void
  disableLock: () => void
}

const getInitialState = () => {
  const enabled = isAppLockEnabled() && hasPinConfigured()
  return {
    isLocked: enabled,
    isEnabled: enabled,
    isBiometricsEnabled: isBiometricsEnabled(),
    timeoutMinutes: getAutoLockTimeout(),
    hasPin: hasPinConfigured(),
  }
}

export const useAppLockStore = create<AppLockState>((set, get) => ({
  ...getInitialState(),

  unlockWithPin: async (pin: string) => {
    const ok = await verifyPin(pin)
    if (ok) {
      setLastActiveTimestamp()
      set({ isLocked: false })
      return true
    }
    return false
  },

  unlockWithBiometrics: async () => {
    const ok = await verifyBiometrics()
    if (ok) {
      setLastActiveTimestamp()
      set({ isLocked: false })
      return true
    }
    return false
  },

  lockApp: () => {
    if (get().isEnabled) {
      set({ isLocked: true })
    }
  },

  refreshLockState: () => {
    const enabled = isAppLockEnabled() && hasPinConfigured()
    set({
      isEnabled: enabled,
      isBiometricsEnabled: isBiometricsEnabled(),
      timeoutMinutes: getAutoLockTimeout(),
      hasPin: hasPinConfigured(),
      isLocked: enabled ? get().isLocked : false,
    })
  },

  disableLock: () => {
    removeAppLock()
    set({
      isLocked: false,
      isEnabled: false,
      isBiometricsEnabled: false,
      hasPin: false,
    })
  },
}))

let listenersInitialized = false
export function setupAppLockAutoLockListeners(): () => void {
  if (typeof window === "undefined" || listenersInitialized) {
    return () => {}
  }
  listenersInitialized = true

  const handleVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      setLastActiveTimestamp()
    } else if (document.visibilityState === "visible") {
      if (shouldAutoLock()) {
        useAppLockStore.getState().lockApp()
      }
    }
  }

  let lastActivity = 0
  const handleUserActivity = () => {
    const now = Date.now()
    if (now - lastActivity > 10000) {
      lastActivity = now
      setLastActiveTimestamp(now)
    }
  }

  document.addEventListener("visibilitychange", handleVisibilityChange)
  window.addEventListener("pointerdown", handleUserActivity, { passive: true })
  window.addEventListener("keydown", handleUserActivity, { passive: true })

  return () => {
    listenersInitialized = false
    document.removeEventListener("visibilitychange", handleVisibilityChange)
    window.removeEventListener("pointerdown", handleUserActivity)
    window.removeEventListener("keydown", handleUserActivity)
  }
}

import { describe, expect, it, beforeEach, vi } from "vitest"
import {
  APP_LOCK_STORAGE_KEYS,
  generateSalt,
  hashPin,
  setupPin,
  verifyPin,
  isAppLockEnabled,
  setAppLockEnabled,
  hasPinConfigured,
  removeAppLock,
  getAutoLockTimeout,
  setAutoLockTimeout,
  getLastActiveTimestamp,
  setLastActiveTimestamp,
  shouldAutoLock,
  isBiometricsSupported,
  isBiometricsEnabled,
  setBiometricsEnabled,
  registerBiometrics,
  verifyBiometrics,
} from "./app-lock"

describe("app-lock module", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  describe("PIN Management", () => {
    it("generates random hex salt", () => {
      const salt1 = generateSalt()
      const salt2 = generateSalt()
      expect(salt1).toHaveLength(32) // 16 bytes = 32 hex chars
      expect(salt2).toHaveLength(32)
      expect(salt1).not.toBe(salt2)
    })

    it("hashes pin deterministically with same salt", async () => {
      const salt = "abcdef1234567890abcdef1234567890"
      const hash1 = await hashPin("123456", salt)
      const hash2 = await hashPin("123456", salt)
      const diffHash = await hashPin("654321", salt)

      expect(hash1).toHaveLength(64) // SHA-256 = 32 bytes = 64 hex chars
      expect(hash1).toBe(hash2)
      expect(hash1).not.toBe(diffHash)
    })

    it("throws when setupPin given less than 4 digits", async () => {
      await expect(setupPin("12")).rejects.toThrow("PIN minimal terdiri dari 4 digit.")
    })

    it("sets up PIN and successfully verifies valid PIN", async () => {
      expect(hasPinConfigured()).toBe(false)
      expect(isAppLockEnabled()).toBe(false)

      await setupPin("123456")

      expect(hasPinConfigured()).toBe(true)
      expect(isAppLockEnabled()).toBe(true)
      expect(localStorage.getItem(APP_LOCK_STORAGE_KEYS.PIN_SALT)).toBeTruthy()
      expect(localStorage.getItem(APP_LOCK_STORAGE_KEYS.PIN_HASH)).toBeTruthy()

      const isCorrect = await verifyPin("123456")
      expect(isCorrect).toBe(true)

      const isWrong = await verifyPin("000000")
      expect(isWrong).toBe(false)
    })

    it("returns false for verifyPin when no PIN is configured", async () => {
      const result = await verifyPin("123456")
      expect(result).toBe(false)
    })

    it("removes all app lock settings upon removeAppLock()", async () => {
      await setupPin("123456")
      setBiometricsEnabled(true)
      setAutoLockTimeout(5)

      removeAppLock()

      expect(isAppLockEnabled()).toBe(false)
      expect(hasPinConfigured()).toBe(false)
      expect(isBiometricsEnabled()).toBe(false)
      expect(localStorage.getItem(APP_LOCK_STORAGE_KEYS.TIMEOUT_MINUTES)).toBeNull()
    })
  })

  describe("Enable/Disable and Timeout", () => {
    it("manages app lock enabled state", () => {
      expect(isAppLockEnabled()).toBe(false)
      setAppLockEnabled(true)
      expect(isAppLockEnabled()).toBe(true)
      setAppLockEnabled(false)
      expect(isAppLockEnabled()).toBe(false)
    })

    it("manages auto-lock timeout in minutes", () => {
      expect(getAutoLockTimeout()).toBe(0) // Default 0 (immediately)
      setAutoLockTimeout(5)
      expect(getAutoLockTimeout()).toBe(5)
      setAutoLockTimeout(-1)
      expect(getAutoLockTimeout()).toBe(0)
    })

    it("tracks last active timestamp", () => {
      const now = 1700000000000
      setLastActiveTimestamp(now)
      expect(getLastActiveTimestamp()).toBe(now)
    })

    it("evaluates shouldAutoLock based on timeout", async () => {
      // Not configured yet
      expect(shouldAutoLock()).toBe(false)

      await setupPin("123456")

      // Timeout 0 (immediately) -> returns true
      setAutoLockTimeout(0)
      expect(shouldAutoLock()).toBe(true)

      // Timeout 5 minutes
      setAutoLockTimeout(5)
      const now = Date.now()
      setLastActiveTimestamp(now)
      expect(shouldAutoLock()).toBe(false) // 0 minutes elapsed < 5 minutes

      // 6 minutes elapsed
      setLastActiveTimestamp(now - 6 * 60 * 1000)
      expect(shouldAutoLock()).toBe(true)
    })
  })

  describe("Biometrics (WebAuthn)", () => {
    it("handles biometrics supported check", async () => {
      expect(await isBiometricsSupported()).toBe(false)

      window.PublicKeyCredential = {
        isUserVerifyingPlatformAuthenticatorAvailable: vi.fn().mockResolvedValue(true),
      } as unknown as typeof PublicKeyCredential

      expect(await isBiometricsSupported()).toBe(true)
    })

    it("manages biometrics enabled flag", () => {
      expect(isBiometricsEnabled()).toBe(false)
      setBiometricsEnabled(true)
      expect(isBiometricsEnabled()).toBe(true)
      setBiometricsEnabled(false)
      expect(isBiometricsEnabled()).toBe(false)
    })

    it("registers biometrics and stores credential ID", async () => {
      const dummyRawId = new Uint8Array([1, 2, 3, 4]).buffer
      const mockCreate = vi.fn().mockResolvedValue({
        rawId: dummyRawId,
      })

      Object.defineProperty(navigator, "credentials", {
        value: {
          create: mockCreate,
          get: vi.fn(),
        },
        configurable: true,
      })

      const registered = await registerBiometrics("test-user")
      expect(registered).toBe(true)
      expect(isBiometricsEnabled()).toBe(true)
      expect(localStorage.getItem(APP_LOCK_STORAGE_KEYS.CREDENTIAL_ID)).toBeTruthy()
    })

    it("verifies biometrics successfully when assertion returned", async () => {
      const mockGet = vi.fn().mockResolvedValue({ id: "assert-id" })
      Object.defineProperty(navigator, "credentials", {
        value: {
          create: vi.fn(),
          get: mockGet,
        },
        configurable: true,
      })

      const ok = await verifyBiometrics()
      expect(ok).toBe(true)
      expect(mockGet).toHaveBeenCalled()
    })

    it("returns false if biometric verification throws or cancels", async () => {
      const mockGet = vi.fn().mockRejectedValue(new Error("User cancelled"))
      Object.defineProperty(navigator, "credentials", {
        value: {
          create: vi.fn(),
          get: mockGet,
        },
        configurable: true,
      })

      const ok = await verifyBiometrics()
      expect(ok).toBe(false)
    })
  })
})

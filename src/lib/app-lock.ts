export const APP_LOCK_STORAGE_KEYS = {
  ENABLED: "gaslighting_app_lock_enabled",
  PIN_HASH: "gaslighting_app_lock_hash",
  PIN_SALT: "gaslighting_app_lock_salt",
  BIO_ENABLED: "gaslighting_app_lock_bio_enabled",
  CREDENTIAL_ID: "gaslighting_app_lock_cred_id",
  TIMEOUT_MINUTES: "gaslighting_app_lock_timeout",
  LAST_ACTIVE: "gaslighting_app_lock_last_active",
} as const

function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let hex = ""
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0")
  }
  return hex
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  const enc = new TextEncoder()
  const data = enc.encode(`${salt}:${pin}`)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return bufferToHex(digest)
}

export function generateSalt(): string {
  const randomBytes = new Uint8Array(16)
  crypto.getRandomValues(randomBytes)
  return bufferToHex(randomBytes.buffer)
}

export function isAppLockEnabled(): boolean {
  if (typeof window === "undefined" || !window.localStorage) return false
  return localStorage.getItem(APP_LOCK_STORAGE_KEYS.ENABLED) === "true"
}

export function setAppLockEnabled(enabled: boolean): void {
  if (typeof window === "undefined" || !window.localStorage) return
  if (enabled) {
    localStorage.setItem(APP_LOCK_STORAGE_KEYS.ENABLED, "true")
  } else {
    localStorage.setItem(APP_LOCK_STORAGE_KEYS.ENABLED, "false")
  }
}

export function hasPinConfigured(): boolean {
  if (typeof window === "undefined" || !window.localStorage) return false
  const salt = localStorage.getItem(APP_LOCK_STORAGE_KEYS.PIN_SALT)
  const hash = localStorage.getItem(APP_LOCK_STORAGE_KEYS.PIN_HASH)
  return Boolean(salt && hash)
}

export async function setupPin(pin: string): Promise<void> {
  if (!pin || pin.length < 4) {
    throw new Error("PIN minimal terdiri dari 4 digit.")
  }
  const salt = generateSalt()
  const hash = await hashPin(pin, salt)
  localStorage.setItem(APP_LOCK_STORAGE_KEYS.PIN_SALT, salt)
  localStorage.setItem(APP_LOCK_STORAGE_KEYS.PIN_HASH, hash)
  localStorage.setItem(APP_LOCK_STORAGE_KEYS.ENABLED, "true")
}

export async function verifyPin(pin: string): Promise<boolean> {
  if (typeof window === "undefined" || !window.localStorage) return false
  const salt = localStorage.getItem(APP_LOCK_STORAGE_KEYS.PIN_SALT)
  const storedHash = localStorage.getItem(APP_LOCK_STORAGE_KEYS.PIN_HASH)
  if (!salt || !storedHash) return false

  const computedHash = await hashPin(pin, salt)
  return computedHash === storedHash
}

export function removeAppLock(): void {
  if (typeof window === "undefined" || !window.localStorage) return
  localStorage.removeItem(APP_LOCK_STORAGE_KEYS.ENABLED)
  localStorage.removeItem(APP_LOCK_STORAGE_KEYS.PIN_SALT)
  localStorage.removeItem(APP_LOCK_STORAGE_KEYS.PIN_HASH)
  localStorage.removeItem(APP_LOCK_STORAGE_KEYS.BIO_ENABLED)
  localStorage.removeItem(APP_LOCK_STORAGE_KEYS.CREDENTIAL_ID)
  localStorage.removeItem(APP_LOCK_STORAGE_KEYS.TIMEOUT_MINUTES)
  localStorage.removeItem(APP_LOCK_STORAGE_KEYS.LAST_ACTIVE)
}

export async function isBiometricsSupported(): Promise<boolean> {
  if (typeof window === "undefined") return false
  try {
    if (!window.PublicKeyCredential) return false
    if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== "function") {
      return false
    }
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

export function isBiometricsEnabled(): boolean {
  if (typeof window === "undefined" || !window.localStorage) return false
  return localStorage.getItem(APP_LOCK_STORAGE_KEYS.BIO_ENABLED) === "true"
}

export function setBiometricsEnabled(enabled: boolean): void {
  if (typeof window === "undefined" || !window.localStorage) return
  localStorage.setItem(APP_LOCK_STORAGE_KEYS.BIO_ENABLED, enabled ? "true" : "false")
}

export async function registerBiometrics(username = "User Gaslighting"): Promise<boolean> {
  if (typeof window === "undefined" || !navigator.credentials) return false
  try {
    const challenge = new Uint8Array(32)
    crypto.getRandomValues(challenge)

    const userId = new Uint8Array(16)
    crypto.getRandomValues(userId)

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: "Gaslighting Finance" },
        user: {
          id: userId,
          name: username,
          displayName: username,
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" }, // ES256
          { alg: -257, type: "public-key" }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
        },
        timeout: 60000,
      },
    })) as PublicKeyCredential | null

    if (credential?.rawId) {
      const base64Id = bufferToBase64(credential.rawId)
      localStorage.setItem(APP_LOCK_STORAGE_KEYS.CREDENTIAL_ID, base64Id)
      setBiometricsEnabled(true)
      return true
    }
    return false
  } catch (err) {
    console.error("Biometric registration failed:", err)
    return false
  }
}

export async function verifyBiometrics(): Promise<boolean> {
  if (typeof window === "undefined" || !navigator.credentials) return false
  try {
    const credIdBase64 = localStorage.getItem(APP_LOCK_STORAGE_KEYS.CREDENTIAL_ID)
    const challenge = new Uint8Array(32)
    crypto.getRandomValues(challenge)

    const publicKeyOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      userVerification: "required",
      timeout: 60000,
    }

    if (credIdBase64) {
      publicKeyOptions.allowCredentials = [
        {
          id: base64ToBuffer(credIdBase64),
          type: "public-key",
          transports: ["internal"],
        },
      ]
    }

    const assertion = await navigator.credentials.get({
      publicKey: publicKeyOptions,
    })

    return Boolean(assertion)
  } catch (err) {
    console.warn("Biometric verification cancelled or failed:", err)
    return false
  }
}

export function getAutoLockTimeout(): number {
  if (typeof window === "undefined" || !window.localStorage) return 0
  const val = localStorage.getItem(APP_LOCK_STORAGE_KEYS.TIMEOUT_MINUTES)
  if (val === null) return 0 // default immediately
  const num = parseInt(val, 10)
  return Number.isFinite(num) && num >= 0 ? num : 0
}

export function setAutoLockTimeout(minutes: number): void {
  if (typeof window === "undefined" || !window.localStorage) return
  localStorage.setItem(APP_LOCK_STORAGE_KEYS.TIMEOUT_MINUTES, String(Math.max(0, minutes)))
}

export function getLastActiveTimestamp(): number {
  if (typeof window === "undefined" || !window.localStorage) return Date.now()
  const val = localStorage.getItem(APP_LOCK_STORAGE_KEYS.LAST_ACTIVE)
  const num = val ? parseInt(val, 10) : 0
  return Number.isFinite(num) && num > 0 ? num : Date.now()
}

export function setLastActiveTimestamp(ts = Date.now()): void {
  if (typeof window === "undefined" || !window.localStorage) return
  localStorage.setItem(APP_LOCK_STORAGE_KEYS.LAST_ACTIVE, String(ts))
}

export function shouldAutoLock(): boolean {
  if (!isAppLockEnabled() || !hasPinConfigured()) return false
  const timeoutMinutes = getAutoLockTimeout()
  if (timeoutMinutes === 0) return true

  const lastActive = getLastActiveTimestamp()
  const elapsedMs = Date.now() - lastActive
  return elapsedMs >= timeoutMinutes * 60 * 1000
}

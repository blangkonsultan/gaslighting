import { useState, useEffect, useCallback } from "react"
import { ShieldCheck, Delete, Fingerprint, LogOut } from "lucide-react"
import { useAppLockStore } from "@/stores/app-lock-store"
import { useAuthStore } from "@/stores/auth-store"
import { supabase } from "@/services/supabase"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { Button } from "@/components/ui/button"

const PIN_LENGTH = 6

export function AppLockScreen() {
  const {
    isLocked,
    isBiometricsEnabled,
    unlockWithPin,
    unlockWithBiometrics,
    disableLock,
  } = useAppLockStore()
  const { reset, sessionUserId } = useAuthStore()

  const [pin, setPin] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleDigit = useCallback(
    async (digit: string) => {
      if (isVerifying || pin.length >= PIN_LENGTH) return
      setErrorMsg("")

      const newPin = pin + digit
      setPin(newPin)

      if (newPin.length === PIN_LENGTH) {
        setIsVerifying(true)
        const success = await unlockWithPin(newPin)
        if (success) {
          setPin("")
          setErrorMsg("")
        } else {
          setPin("")
          setErrorMsg("PIN salah. Silakan coba lagi.")
        }
        setIsVerifying(false)
      }
    },
    [pin, isVerifying, unlockWithPin]
  )

  const handleDelete = useCallback(() => {
    if (isVerifying) return
    setErrorMsg("")
    setPin((prev) => prev.slice(0, -1))
  }, [isVerifying])

  const handleBiometricUnlock = useCallback(async () => {
    if (!isBiometricsEnabled || isVerifying) return
    setIsVerifying(true)
    setErrorMsg("")
    const success = await unlockWithBiometrics()
    if (!success) {
      setErrorMsg("Verifikasi biometrik gagal atau dibatalkan.")
    }
    setIsVerifying(false)
  }, [isBiometricsEnabled, isVerifying, unlockWithBiometrics])

  // Try biometrics automatically on mount if enabled
  useEffect(() => {
    if (isLocked && isBiometricsEnabled) {
      const timer = window.setTimeout(() => {
        void handleBiometricUnlock()
      }, 100)
      return () => window.clearTimeout(timer)
    }
  }, [isLocked, isBiometricsEnabled, handleBiometricUnlock])

  // Listen to physical keyboard events
  useEffect(() => {
    if (!isLocked) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        void handleDigit(e.key)
      } else if (e.key === "Backspace") {
        handleDelete()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isLocked, handleDigit, handleDelete])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error("Sign out error:", err)
    } finally {
      disableLock()
      reset()
      setIsLoggingOut(false)
      setShowLogoutConfirm(false)
      window.location.href = "/auth/login"
    }
  }

  if (!isLocked || !sessionUserId) return null

  return (
    <div
      role="dialog"
      aria-label="Kunci Aplikasi"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-[#FBE8CE] p-6 text-[#3D3D3D] select-none touch-manipulation overflow-y-auto"
    >
      {/* Header */}
      <div className="flex flex-col items-center gap-3 pt-6 sm:pt-10">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#9AB17A]/20 border border-[#9AB17A]/40 text-[#607447] shadow-inner">
          <ShieldCheck size={36} />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold tracking-tight text-[#3D3D3D]">
            Gaslighting
          </h1>
          <p className="text-xs text-[#6F6B58] mt-0.5">
            Aplikasi Terkunci Demi Keamanan Finansial
          </p>
        </div>
      </div>

      {/* PIN Dots & Error */}
      <div className="flex flex-col items-center gap-4 my-auto py-4">
        <p className="text-sm font-medium text-[#3D3D3D]">
          Masukkan {PIN_LENGTH} digit PIN
        </p>
        <div className="flex gap-3">
          {Array.from({ length: PIN_LENGTH }).map((_, i) => {
            const isFilled = i < pin.length
            return (
              <div
                key={i}
                data-testid={`pin-dot-${i}`}
                className={`h-4 w-4 rounded-full border-2 transition-all duration-150 ${
                  isFilled
                    ? "bg-[#9AB17A] border-[#9AB17A] scale-110 shadow-sm"
                    : "border-[#C3CC9B] bg-transparent"
                } ${errorMsg ? "border-destructive bg-destructive/20 animate-shake" : ""}`}
              />
            )
          })}
        </div>
        {errorMsg ? (
          <p className="text-xs font-semibold text-destructive text-center max-w-[260px] animate-fade-in">
            {errorMsg}
          </p>
        ) : (
          <p className="text-xs text-transparent select-none">placeholder</p>
        )}
      </div>

      {/* Numeric Keypad */}
      <div className="w-full max-w-[280px] pb-4">
        <div className="grid grid-cols-3 gap-3.5 sm:gap-4 place-items-center">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <button
              key={digit}
              type="button"
              data-testid={`keypad-${digit}`}
              onClick={() => void handleDigit(String(digit))}
              disabled={isVerifying}
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E4DFB5]/70 border border-[#D5CF9E] text-xl font-bold text-[#3D3D3D] shadow-xs active:bg-[#C3CC9B] active:scale-95 transition-all touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9AB17A]"
            >
              {digit}
            </button>
          ))}

          {/* Biometrics button or empty placeholder */}
          {isBiometricsEnabled ? (
            <button
              type="button"
              data-testid="keypad-biometrics"
              aria-label="Masuk dengan Biometrik"
              onClick={() => void handleBiometricUnlock()}
              disabled={isVerifying}
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#9AB17A]/15 border border-[#9AB17A]/30 text-[#607447] shadow-xs active:bg-[#9AB17A]/30 active:scale-95 transition-all touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9AB17A]"
            >
              <Fingerprint size={26} />
            </button>
          ) : (
            <div className="h-16 w-16" />
          )}

          {/* 0 */}
          <button
            type="button"
            data-testid="keypad-0"
            onClick={() => void handleDigit("0")}
            disabled={isVerifying}
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E4DFB5]/70 border border-[#D5CF9E] text-xl font-bold text-[#3D3D3D] shadow-xs active:bg-[#C3CC9B] active:scale-95 transition-all touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9AB17A]"
          >
            0
          </button>

          {/* Backspace */}
          <button
            type="button"
            data-testid="keypad-delete"
            aria-label="Hapus Digit"
            onClick={handleDelete}
            disabled={isVerifying || pin.length === 0}
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E4DFB5]/40 border border-[#D5CF9E]/60 text-[#6F6B58] shadow-xs active:bg-[#C3CC9B] active:scale-95 disabled:opacity-30 disabled:active:scale-100 transition-all touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9AB17A]"
          >
            <Delete size={22} />
          </button>
        </div>
      </div>

      {/* Forgot PIN / Sign out link */}
      <div className="pb-3 text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowLogoutConfirm(true)}
          className="text-xs text-[#6F6B58] hover:text-destructive hover:bg-transparent underline underline-offset-4 touch-target gap-1.5"
        >
          <LogOut size={13} />
          <span>Lupa PIN? Keluar Akun</span>
        </Button>
      </div>

      {/* Confirm Logout Dialog */}
      <ConfirmDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        title="Keluar dari Akun?"
        description="Jika Anda lupa PIN, Anda dapat keluar dan masuk kembali menggunakan email serta kata sandi akun Anda. Kunci PIN akan dinonaktifkan."
        confirmLabel="Ya, Keluar Akun"
        cancelLabel="Batal"
        variant="destructive"
        loading={isLoggingOut}
        onConfirm={() => void handleLogout()}
      />
    </div>
  )
}

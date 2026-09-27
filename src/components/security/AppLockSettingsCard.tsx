import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { Lock, Fingerprint, KeyRound } from "lucide-react"
import { toast } from "sonner"
import { useAppLockStore } from "@/stores/app-lock-store"
import {
  setupPin,
  verifyPin,
  isBiometricsSupported,
  registerBiometrics,
  setBiometricsEnabled,
  getAutoLockTimeout,
  setAutoLockTimeout,
} from "@/lib/app-lock"

export function AppLockSettingsCard() {
  const {
    isEnabled,
    isBiometricsEnabled,
    lockApp,
    refreshLockState,
    disableLock,
  } = useAppLockStore()

  const [hasBioHardware, setHasBioHardware] = useState(false)
  const [timeoutMinutes, setTimeoutMinutes] = useState(getAutoLockTimeout())

  // Dialog states
  const [showSetupDialog, setShowSetupDialog] = useState(false)
  const [setupPinVal, setSetupPinVal] = useState("")
  const [setupPinConfirm, setSetupPinConfirm] = useState("")
  const [setupWithBio, setSetupWithBio] = useState(false)
  const [setupError, setSetupError] = useState("")

  const [showChangeDialog, setShowChangeDialog] = useState(false)
  const [oldPin, setOldPin] = useState("")
  const [newPin, setNewPin] = useState("")
  const [newPinConfirm, setNewPinConfirm] = useState("")
  const [changeError, setChangeError] = useState("")

  const [showDisableConfirm, setShowDisableConfirm] = useState(false)

  useEffect(() => {
    void isBiometricsSupported().then((supported) => {
      setHasBioHardware(supported)
    })
  }, [])

  const handleToggleLock = (checked: boolean) => {
    if (checked) {
      setSetupPinVal("")
      setSetupPinConfirm("")
      setSetupError("")
      setSetupWithBio(hasBioHardware)
      setShowSetupDialog(true)
    } else {
      setShowDisableConfirm(true)
    }
  }

  const handleSaveSetup = async () => {
    setSetupError("")
    if (setupPinVal.length !== 6 || !/^\d{6}$/.test(setupPinVal)) {
      setSetupError("PIN harus terdiri dari tepat 6 angka.")
      return
    }
    if (setupPinVal !== setupPinConfirm) {
      setSetupError("Konfirmasi PIN tidak cocok.")
      return
    }

    try {
      await setupPin(setupPinVal)
      if (setupWithBio && hasBioHardware) {
        await registerBiometrics()
      }
      refreshLockState()
      setShowSetupDialog(false)
      toast.success("Kunci layar PIN berhasil diaktifkan.")
    } catch (err) {
      setSetupError(err instanceof Error ? err.message : "Gagal mengaktifkan PIN.")
    }
  }

  const handleSaveChange = async () => {
    setChangeError("")
    if (oldPin.length !== 6) {
      setChangeError("Masukkan 6 digit PIN lama Anda.")
      return
    }
    const isOldCorrect = await verifyPin(oldPin)
    if (!isOldCorrect) {
      setChangeError("PIN lama Anda salah.")
      return
    }
    if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      setChangeError("PIN baru harus terdiri dari 6 angka.")
      return
    }
    if (newPin !== newPinConfirm) {
      setChangeError("Konfirmasi PIN baru tidak cocok.")
      return
    }

    try {
      await setupPin(newPin)
      refreshLockState()
      setShowChangeDialog(false)
      setOldPin("")
      setNewPin("")
      setNewPinConfirm("")
      toast.success("PIN keamanan berhasil diperbarui.")
    } catch (err) {
      setChangeError(err instanceof Error ? err.message : "Gagal memperbarui PIN.")
    }
  }

  const handleToggleBiometrics = async (checked: boolean) => {
    if (checked) {
      const ok = await registerBiometrics()
      if (ok) {
        refreshLockState()
        toast.success("Biometrik berhasil didaftarkan.")
      } else {
        toast.error("Gagal mendaftarkan biometrik perangkat.")
      }
    } else {
      setBiometricsEnabled(false)
      refreshLockState()
      toast.success("Biometrik dinonaktifkan.")
    }
  }

  const handleTimeoutChange = (val: string | null) => {
    if (!val) return
    const mins = parseInt(val, 10)
    setAutoLockTimeout(mins)
    setTimeoutMinutes(mins)
    refreshLockState()
    toast.success("Waktu penguncian otomatis diperbarui.")
  }

  const handleConfirmDisable = () => {
    disableLock()
    setShowDisableConfirm(false)
    toast.success("Kunci aplikasi dinonaktifkan.")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Lock size={18} className="text-primary" />
          <span>Keamanan Aplikasi</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Lock Switch */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Kunci Layar (PIN / Biometrik)</p>
            <p className="text-xs text-muted-foreground">
              Kunci otomatis aplikasi saat ditutup atau ditinggalkan untuk melindungi data finansial.
            </p>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={handleToggleLock}
            aria-label="Toggle kunci layar"
          />
        </div>

        {isEnabled && (
          <div className="flex flex-col gap-3 pt-2 border-t border-border">
            {/* Biometric Toggle if hardware supports */}
            {hasBioHardware && (
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Fingerprint size={16} className="text-primary" />
                    <p className="text-sm font-medium">Buka dengan Biometrik</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Gunakan sensor sidik jari atau Face ID untuk membuka kunci lebih cepat.
                  </p>
                </div>
                <Switch
                  checked={isBiometricsEnabled}
                  onCheckedChange={(val) => void handleToggleBiometrics(val)}
                  aria-label="Toggle biometrik"
                />
              </div>
            )}

            {/* Auto Lock Timeout */}
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Kunci Otomatis</p>
                <p className="text-xs text-muted-foreground">
                  Batas waktu sebelum aplikasi meminta PIN kembali.
                </p>
              </div>
              <Select
                value={String(timeoutMinutes)}
                onValueChange={handleTimeoutChange}
              >
                <SelectTrigger className="w-36 touch-target text-xs">
                  <SelectValue placeholder="Pilih waktu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Segera</SelectItem>
                  <SelectItem value="1">1 Menit</SelectItem>
                  <SelectItem value="5">5 Menit</SelectItem>
                  <SelectItem value="15">15 Menit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="touch-target text-xs"
                onClick={() => {
                  setOldPin("")
                  setNewPin("")
                  setNewPinConfirm("")
                  setChangeError("")
                  setShowChangeDialog(true)
                }}
              >
                <KeyRound size={14} className="mr-1.5" />
                Ubah PIN
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="touch-target text-xs border-primary/30 text-primary hover:bg-primary/10"
                onClick={() => {
                  lockApp()
                  toast.info("Aplikasi terkunci.")
                }}
              >
                <Lock size={14} className="mr-1.5" />
                Kunci Sekarang
              </Button>
            </div>
          </div>
        )}

        {/* SETUP PIN DIALOG */}
        <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock size={18} className="text-primary" />
                <span>Atur 6 Digit PIN Keamanan</span>
              </DialogTitle>
              <DialogDescription>
                PIN ini akan digunakan untuk membuka aplikasi saat layar terkunci.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="setup-pin">PIN Baru (6 Digit)</Label>
                <Input
                  id="setup-pin"
                  data-testid="setup-pin-input"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Contoh: 123456"
                  value={setupPinVal}
                  onChange={(e) => setSetupPinVal(e.target.value.replace(/\D/g, ""))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="setup-pin-confirm">Konfirmasi PIN (6 Digit)</Label>
                <Input
                  id="setup-pin-confirm"
                  data-testid="setup-pin-confirm-input"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Masukkan ulang 6 digit PIN"
                  value={setupPinConfirm}
                  onChange={(e) => setSetupPinConfirm(e.target.value.replace(/\D/g, ""))}
                />
              </div>

              {hasBioHardware && (
                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Aktifkan Biometrik Sekaligus</p>
                    <p className="text-xs text-muted-foreground">
                      Daftarkan sidik jari atau Face ID sekarang.
                    </p>
                  </div>
                  <Switch
                    checked={setupWithBio}
                    onCheckedChange={setSetupWithBio}
                  />
                </div>
              )}

              {setupError && (
                <p className="text-xs font-medium text-destructive" role="alert">
                  {setupError}
                </p>
              )}
            </div>

            <DialogFooter className="gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSetupDialog(false)}
                className="touch-target"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={() => void handleSaveSetup()}
                className="touch-target"
              >
                Simpan & Aktifkan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* CHANGE PIN DIALOG */}
        <Dialog open={showChangeDialog} onOpenChange={setShowChangeDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound size={18} className="text-primary" />
                <span>Ubah PIN Keamanan</span>
              </DialogTitle>
              <DialogDescription>
                Masukkan PIN saat ini untuk memverifikasi identitas Anda, lalu buat PIN baru.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="old-pin">PIN Lama</Label>
                <Input
                  id="old-pin"
                  data-testid="old-pin-input"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="PIN 6-digit lama"
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ""))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-pin">PIN Baru (6 Digit)</Label>
                <Input
                  id="new-pin"
                  data-testid="new-pin-input"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="PIN 6-digit baru"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-pin-confirm">Konfirmasi PIN Baru</Label>
                <Input
                  id="new-pin-confirm"
                  data-testid="new-pin-confirm-input"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Ketik ulang PIN baru"
                  value={newPinConfirm}
                  onChange={(e) => setNewPinConfirm(e.target.value.replace(/\D/g, ""))}
                />
              </div>

              {changeError && (
                <p className="text-xs font-medium text-destructive" role="alert">
                  {changeError}
                </p>
              )}
            </div>

            <DialogFooter className="gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowChangeDialog(false)}
                className="touch-target"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={() => void handleSaveChange()}
                className="touch-target"
              >
                Perbarui PIN
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DISABLE CONFIRM DIALOG */}
        <ConfirmDialog
          open={showDisableConfirm}
          onOpenChange={setShowDisableConfirm}
          title="Nonaktifkan Kunci Aplikasi?"
          description="Aplikasi tidak akan meminta PIN atau biometrik lagi saat ditutup. Pastikan perangkat Anda aman."
          confirmLabel="Ya, Nonaktifkan"
          cancelLabel="Batal"
          variant="destructive"
          onConfirm={handleConfirmDisable}
        />
      </CardContent>
    </Card>
  )
}

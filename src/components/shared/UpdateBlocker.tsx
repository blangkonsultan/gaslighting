import { AppLogo } from "@/components/shared/AppLogo"
import { Button } from "@/components/ui/button"

export interface UpdateBlockerProps {
  show: boolean
}

export function UpdateBlocker({ show }: UpdateBlockerProps) {
  if (!show) return null

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label="Pembaruan tersedia"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#FBE8CE] p-6 text-[#3D3D3D] select-none"
    >
      <div className="flex flex-col items-center gap-6 text-center max-w-sm">
        <AppLogo size={64} className="drop-shadow-xs" />
        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight">Pembaruan Tersedia</h1>
          <p className="text-sm text-[#6F6B58]">
            Versi baru aplikasi telah tersedia. Muat ulang halaman untuk mendapatkan versi terbaru.
          </p>
        </div>
        <Button
          onClick={() => window.location.reload()}
          className="touch-target w-full max-w-xs"
        >
          Muat Ulang
        </Button>
      </div>
    </div>
  )
}

import { useEffect } from "react"
import { toast } from "sonner"

export function useUpdatePrompt(): void {
  useEffect(() => {
    const handleSwUpdated = () => {
      toast.info("Versi baru tersedia", {
        id: "sw-update",
        description: "Aplikasi telah diperbarui. Muat ulang untuk mendapatkan versi terbaru.",
        duration: Infinity,
        dismissible: false,
        action: {
          label: "Muat Ulang",
          onClick: () => {
            window.location.reload()
          },
        },
      })
    }

    window.addEventListener("sw-updated", handleSwUpdated)

    return () => {
      window.removeEventListener("sw-updated", handleSwUpdated)
    }
  }, [])
}

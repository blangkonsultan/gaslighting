import { useEffect, useState } from "react"

export function useUpdatePrompt(): { showUpdate: boolean } {
  const [showUpdate, setShowUpdate] = useState(false)

  useEffect(() => {
    const handleSwUpdated = () => {
      setShowUpdate(true)
    }

    window.addEventListener("sw-updated", handleSwUpdated)

    return () => {
      window.removeEventListener("sw-updated", handleSwUpdated)
    }
  }, [])

  return { showUpdate }
}

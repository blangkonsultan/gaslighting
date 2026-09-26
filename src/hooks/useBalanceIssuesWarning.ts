import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-client"
import { getBalanceRecalcPreview } from "@/services/balance-recalculation.service"

const WARNING_DISMISSAL_MS = 24 * 60 * 60 * 1000

export function useBalanceIssuesWarning(userId: string | undefined) {
  const balanceIssuesQuery = useQuery({
    queryKey: queryKeys.balanceRecalculation.preview(userId ?? ""),
    queryFn: () => getBalanceRecalcPreview(userId ?? ""),
    enabled: Boolean(userId),
    staleTime: 60_000,
  })

  const balanceIssues = balanceIssuesQuery.data ?? []
  const hasBalanceIssues = balanceIssues.some((p) => p.needsUpdate)

  const [warningDismissed, setWarningDismissed] = useState(() => {
    if (!userId || typeof window === "undefined") return false
    const dismissed = localStorage.getItem(`balance-warning-dismissed-${userId}`)
    return Boolean(dismissed && Number.parseInt(dismissed, 10) > Date.now() - WARNING_DISMISSAL_MS)
  })

  function handleDismissWarning() {
    if (!userId) return
    localStorage.setItem(`balance-warning-dismissed-${userId}`, Date.now().toString())
    setWarningDismissed(true)
    balanceIssuesQuery.refetch()
  }

  const showWarning = hasBalanceIssues && !warningDismissed

  return {
    balanceIssues,
    hasBalanceIssues,
    showWarning,
    handleDismissWarning,
  }
}

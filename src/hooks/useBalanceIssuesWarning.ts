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
  const hasBalanceIssues = balanceIssues.some((p) => p.needsUpdate && p.wouldBeNegative)

  function handleDismissWarning() {
    if (!userId) return
    localStorage.setItem(`balance-warning-dismissed-${userId}`, Date.now().toString())
    balanceIssuesQuery.refetch()
  }

  const dismissedTimestamp = userId ? localStorage.getItem(`balance-warning-dismissed-${userId}`) : null
  const warningDismissed =
    dismissedTimestamp && Number.parseInt(dismissedTimestamp, 10) > Date.now() - WARNING_DISMISSAL_MS

  const showWarning = hasBalanceIssues && !warningDismissed

  return {
    balanceIssues,
    hasBalanceIssues,
    showWarning,
    handleDismissWarning,
  }
}

import { useMutation, useQuery } from "@tanstack/react-query"
import { queryClient, queryKeys } from "@/lib/query-client"
import {
  getBalanceRecalcPreview,
  applyBalanceRecalculation,
} from "@/services/balance-recalculation.service"
import type { BalanceRecalcPreview, BalanceRecalcSummary } from "@/types/financial"

function calculateSummary(preview: BalanceRecalcPreview[]): BalanceRecalcSummary {
  const totalCount = preview.length
  const updateCount = preview.filter((p) => p.needsUpdate && !p.wouldBeNegative).length
  const skipCount = preview.filter((p) => p.needsUpdate && p.wouldBeNegative).length
  const hasIssues = skipCount > 0
  const totalDifference = preview
    .filter((p) => p.needsUpdate && !p.wouldBeNegative)
    .reduce((sum, p) => sum + (p.calculatedBalance - p.currentBalance), 0)

  return { totalCount, updateCount, skipCount, hasIssues, totalDifference }
}

export function useBalanceRecalculation(userId: string) {
  const previewQuery = useQuery({
    queryKey: queryKeys.balanceRecalculation.preview(userId),
    queryFn: () => getBalanceRecalcPreview(userId),
    enabled: Boolean(userId),
    staleTime: 30_000,
  })

  const applyMutation = useMutation({
    mutationFn: () => applyBalanceRecalculation(userId),
    onSuccess: async () => {
      try {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all }),
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary }),
          queryClient.invalidateQueries({ queryKey: queryKeys.balanceRecalculation.preview(userId) }),
        ])
      } catch (error) {
        console.error("Failed to invalidate queries:", error)
      }
    },
  })

  const summary = previewQuery.data ? calculateSummary(previewQuery.data) : null

  return {
    preview: previewQuery.data ?? [],
    isPreviewLoading: previewQuery.isLoading,
    isPreviewError: previewQuery.isError,
    summary,
    applyRecalculation: applyMutation.mutateAsync,
    isApplying: applyMutation.isPending,
    applyError: applyMutation.error,
    refetchPreview: previewQuery.refetch,
  }
}

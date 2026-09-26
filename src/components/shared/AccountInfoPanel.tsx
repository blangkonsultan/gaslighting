import type { ReactNode } from "react"
import { formatCurrency } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import { t } from "@/lib/i18n"

interface AccountInfoPanelProps {
  accountLabel: string
  balance?: number
  projectedBalance?: number | null
  projectedLabel?: string
  extraRows?: ReactNode
}

export function AccountInfoPanel({
  accountLabel,
  balance,
  projectedBalance,
  projectedLabel = t.account_info_projected_tx,
  extraRows,
}: AccountInfoPanelProps) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3 text-sm">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-muted-foreground">{t.account_info_selected_account}</span>
        <span className="font-medium">{accountLabel}</span>
      </div>
      {balance != null && (
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-muted-foreground">{t.account_info_current_balance}</span>
          <span className="font-medium tabular-nums">{formatCurrency(balance)}</span>
        </div>
      )}
      {projectedBalance != null && (
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-muted-foreground">{projectedLabel}</span>
          <span className={cn("font-medium tabular-nums", projectedBalance < 0 && "text-destructive")}>
            {formatCurrency(projectedBalance)}
          </span>
        </div>
      )}
      {extraRows}
    </div>
  )
}

import type { ReactNode } from "react"
import { formatCurrency } from "@/lib/formatters"
import { cn } from "@/lib/utils"

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
  projectedLabel = "Equity setelah transaksi:",
  extraRows,
}: AccountInfoPanelProps) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3 text-sm">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-muted-foreground">Rekening dipilih:</span>
        <span className="font-medium">{accountLabel}</span>
      </div>
      {balance != null && (
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-muted-foreground">Equity saat ini:</span>
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

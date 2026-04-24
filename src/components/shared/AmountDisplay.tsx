import { formatCurrency } from "@/lib/formatters"
import { cn } from "@/lib/utils"

interface AmountDisplayProps {
  amount: number
  className?: string
  showSign?: boolean
}

export function AmountDisplay({ amount, className, showSign = false }: AmountDisplayProps) {
  const formatted = formatCurrency(Math.abs(amount))
  const sign = showSign ? (amount >= 0 ? "+" : "-") : amount < 0 ? "-" : ""

  return (
    <span
      className={cn(
        "font-semibold tabular-nums",
        amount < 0 ? "text-destructive" : "text-foreground",
        className
      )}
    >
      {sign}
      {formatted}
    </span>
  )
}

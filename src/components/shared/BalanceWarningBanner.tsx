import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  message: string
  actionLabel?: string
  onActionClick?: () => void
  onDismiss?: () => void
}

export function BalanceWarningBanner({ message, actionLabel, onActionClick, onDismiss }: Props) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-200/50 bg-amber-50 p-3 dark:border-amber-900/30 dark:bg-amber-950/30">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="text-sm text-amber-800 dark:text-amber-200">{message}</p>
        {actionLabel && onActionClick && (
          <Button
            size="sm"
            variant="outline"
            className="w-fit text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/30"
            onClick={onActionClick}
          >
            {actionLabel}
          </Button>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          className="shrink-0 rounded p-1 text-amber-600 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/30 touch-target"
          onClick={onDismiss}
          aria-label="Tutup"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  className?: string
  size?: number
}

export function LoadingSpinner({ className, size = 24 }: LoadingSpinnerProps) {
  return (
    <Loader2
      className={cn("animate-spin text-primary", className)}
      size={size}
    />
  )
}

export function PageLoading() {
  return (
    <div className="flex min-h-dvh flex-1 items-center justify-center bg-background">
      <LoadingSpinner size={32} />
    </div>
  )
}

import type { ReactNode } from "react"
import type { FieldError, Merge } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type FieldErrorValue = Merge<FieldError, (Merge<FieldError, FieldError> | undefined)[]>

interface FormFieldProps {
  label?: ReactNode
  htmlFor?: string
  error?: FieldErrorValue
  children: ReactNode
  className?: string
}

export function FormField({ label, htmlFor, error, children, className }: FormFieldProps) {
  const message = error?.message
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {message && <p className="text-xs text-destructive" role="alert">{String(message)}</p>}
    </div>
  )
}

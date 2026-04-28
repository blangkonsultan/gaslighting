import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

type SuggestionInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "value" | "defaultValue" | "onChange"
> & {
  value: string
  onValueChange: (value: string) => void
  suggestions: string[]
  emptyText?: string
}

export const SuggestionInput = React.forwardRef<HTMLInputElement, SuggestionInputProps>(
  (
    {
      className,
      value,
      onValueChange,
      suggestions,
      emptyText = "Tidak ada saran",
      onFocus,
      onBlur,
      onKeyDown,
      disabled,
      ...props
    },
    ref
  ) => {
    const containerRef = React.useRef<HTMLDivElement | null>(null)
    const [open, setOpen] = React.useState(false)
    const [activeIndex, setActiveIndex] = React.useState<number>(-1)

    const filtered = React.useMemo(() => {
      const q = value.trim().toLowerCase()
      if (!q) return suggestions
      return suggestions.filter((s) => s.toLowerCase().includes(q))
    }, [suggestions, value])

    const hasItems = filtered.length > 0

    function commitSelection(nextValue: string) {
      onValueChange(nextValue)
      setOpen(false)
      setActiveIndex(-1)
    }

    function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
      if (!disabled && (suggestions.length > 0 || hasItems)) setOpen(true)
      onFocus?.(e)
    }

    function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
      // Allow pointer selection before closing.
      window.setTimeout(() => {
        const el = document.activeElement
        if (containerRef.current && el && containerRef.current.contains(el)) return
        setOpen(false)
        setActiveIndex(-1)
      }, 0)
      onBlur?.(e)
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      onValueChange(e.target.value)
      if (!disabled) setOpen(true)
      setActiveIndex(-1)
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
      onKeyDown?.(e)
      if (e.defaultPrevented) return
      if (disabled) return

      if (e.key === "Escape") {
        setOpen(false)
        setActiveIndex(-1)
        return
      }

      if (e.key === "ArrowDown") {
        if (!open) setOpen(true)
        if (!hasItems) return
        e.preventDefault()
        setActiveIndex((i) => {
          const next = i + 1
          return next >= filtered.length ? 0 : next
        })
        return
      }

      if (e.key === "ArrowUp") {
        if (!open) setOpen(true)
        if (!hasItems) return
        e.preventDefault()
        setActiveIndex((i) => {
          const next = i - 1
          return next < 0 ? filtered.length - 1 : next
        })
        return
      }

      if (e.key === "Enter" && open && activeIndex >= 0 && activeIndex < filtered.length) {
        e.preventDefault()
        commitSelection(filtered[activeIndex] ?? "")
      }
    }

    return (
      <div ref={containerRef} className="relative">
        <Input
          ref={ref}
          value={value}
          disabled={disabled}
          className={cn(className)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          aria-expanded={open}
          aria-controls={props.id ? `${props.id}-suggestions` : undefined}
          aria-autocomplete="list"
          {...props}
        />

        {open && (
          <div
            id={props.id ? `${props.id}-suggestions` : undefined}
            role="listbox"
            className={cn(
              "absolute z-50 mt-1 max-h-64 w-full overflow-x-hidden overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none"
            )}
          >
            {hasItems ? (
              filtered.map((item, idx) => (
                <button
                  key={item}
                  type="button"
                  role="option"
                  aria-selected={idx === activeIndex}
                  tabIndex={-1}
                  className={cn(
                    "w-full rounded-md px-1.5 py-2 text-left text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                    idx === activeIndex && "bg-accent text-accent-foreground"
                  )}
                  onMouseDown={(ev) => {
                    // Prevent input blur before click.
                    ev.preventDefault()
                  }}
                  onClick={() => commitSelection(item)}
                >
                  {item}
                </button>
              ))
            ) : (
              <div className="px-2 py-2 text-sm text-muted-foreground">{emptyText}</div>
            )}
          </div>
        )}
      </div>
    )
  }
)

SuggestionInput.displayName = "SuggestionInput"


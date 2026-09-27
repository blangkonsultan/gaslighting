import { formatCurrency } from "@/lib/formatters"
import type { TemplateListRow } from "@/services/transaction-templates.service"
import { Bookmark } from "lucide-react"

export interface TemplatePickerProps {
  templates: TemplateListRow[]
  onSelectTemplate: (template: TemplateListRow) => void
  onManage: () => void
}

export function TemplatePicker({ templates, onSelectTemplate, onManage }: TemplatePickerProps) {
  if (!templates || templates.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-1.5" data-testid="template-picker">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Template Cepat
        </span>
        <button
          type="button"
          onClick={onManage}
          className="touch-target inline-flex items-center text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1 py-0.5"
          aria-label="Kelola template"
        >
          Kelola
        </button>
      </div>

      <div
        className="flex gap-2 overflow-x-auto pb-2 pt-0.5 -mx-1 px-1 scrollbar-hide focus-visible:outline-none"
        role="region"
        aria-label="Daftar template cepat"
        tabIndex={0}
      >
        {templates.map((template) => {
          const catIcon = template.categories?.icon
          const amountText = template.amount != null ? formatCurrency(Number(template.amount)) : "—"

          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelectTemplate(template)}
              className="touch-target group flex min-w-[80px] max-w-[120px] shrink-0 flex-col items-center justify-center rounded-xl border border-border bg-card p-2 text-center transition-all hover:border-primary/50 hover:bg-muted/40 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Gunakan template ${template.name}`}
            >
              <div className="mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                {catIcon ? (
                  <span className="text-sm leading-none">{catIcon}</span>
                ) : (
                  <Bookmark size={14} className="text-primary" />
                )}
              </div>
              <span className="w-full truncate text-xs font-medium text-foreground group-hover:text-primary">
                {template.name}
              </span>
              <span className="w-full truncate text-[11px] text-muted-foreground tabular-nums">
                {amountText}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

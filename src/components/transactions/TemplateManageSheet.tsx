import { useState } from "react"
import { Bookmark, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { EmptyState } from "@/components/shared/EmptyState"
import { formatCurrency } from "@/lib/formatters"
import { useDeleteTemplate } from "@/hooks/useTransactionTemplates"
import type { TemplateListRow } from "@/services/transaction-templates.service"

export interface TemplateManageSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templates: TemplateListRow[]
  userId: string
}

export function TemplateManageSheet({
  open,
  onOpenChange,
  templates,
  userId,
}: TemplateManageSheetProps) {
  const [deleteTarget, setDeleteTarget] = useState<TemplateListRow | null>(null)
  const deleteMutation = useDeleteTemplate()

  async function handleDelete() {
    if (!deleteTarget) return

    try {
      await deleteMutation.mutateAsync({
        userId,
        templateId: deleteTarget.id,
      })
      toast.success("Template berhasil dihapus.")
      setDeleteTarget(null)
    } catch {
      toast.error("Gagal menghapus template.")
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-2xl p-5">
          <div className="mx-auto h-1.5 w-12 rounded-full bg-muted-foreground/30 mb-1" />
          <SheetHeader className="text-left space-y-1">
            <SheetTitle className="text-lg font-bold">Template Saya</SheetTitle>
          </SheetHeader>

          <div className="py-2">
            {!templates || templates.length === 0 ? (
              <EmptyState
                icon={<Bookmark size={36} className="text-muted-foreground" />}
                title="Belum ada template"
                description="Simpan transaksi sebagai template untuk penggunaan cepat."
              />
            ) : (
              <div className="flex max-h-[60vh] flex-col divide-y divide-border overflow-y-auto pr-1">
                {templates.map((tpl) => {
                  const typeLabel = tpl.type === "expense" ? "Pengeluaran" : "Pemasukan"
                  const subtitleParts = [
                    typeLabel,
                    tpl.accounts?.name,
                    tpl.amount != null ? formatCurrency(Number(tpl.amount)) : null,
                  ].filter(Boolean)
                  const subtitle = subtitleParts.join(" · ")

                  return (
                    <div
                      key={tpl.id}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                          {tpl.categories?.icon ? (
                            <span className="leading-none">{tpl.categories.icon}</span>
                          ) : (
                            <Bookmark size={16} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {tpl.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {subtitle}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteTarget(tpl)}
                        className="touch-target shrink-0 text-destructive hover:bg-destructive/10"
                        aria-label={`Hapus template ${tpl.name}`}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="touch-target w-full"
              >
                Tutup
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(isOpen) => {
          if (!isOpen) setDeleteTarget(null)
        }}
        title="Hapus Template"
        description={`Yakin ingin menghapus template "${deleteTarget?.name}"?`}
        confirmLabel="Hapus"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </>
  )
}

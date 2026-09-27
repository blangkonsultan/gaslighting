import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Bookmark, Plus, Search, Trash2, ArrowRight, Pencil, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/shared/EmptyState"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { PageLoading } from "@/components/shared/LoadingSpinner"
import { CategoryIcon } from "@/components/shared/CategoryIcon"
import { formatCurrency } from "@/lib/formatters"
import { TemplateEditDialog } from "@/components/transactions/TemplateEditDialog"
import { useAuthStore } from "@/stores/auth-store"
import { useTransactionTemplates, useDeleteTemplate } from "@/hooks/useTransactionTemplates"
import type { TemplateListRow } from "@/services/transaction-templates.service"

export default function TemplatesPage() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const userId = profile?.id ?? ""
  const [search, setSearch] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<TemplateListRow | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<TemplateListRow | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const { data: templates, isLoading, isError } = useTransactionTemplates(userId)
  const deleteMutation = useDeleteTemplate()

  const filteredTemplates = useMemo(() => {
    if (!templates) return []
    if (!search.trim()) return templates
    const q = search.toLowerCase()
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.accounts?.name && t.accounts.name.toLowerCase().includes(q)) ||
        (t.categories?.name && t.categories.name.toLowerCase().includes(q))
    )
  }, [templates, search])

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

  if (isLoading) {
    return <PageLoading />
  }

  return (
    <div className="mx-auto w-full max-w-4xl p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => navigate(-1)}
            className="touch-target -ml-1 text-muted-foreground hover:text-foreground shrink-0"
            aria-label="Kembali"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Template Transaksi
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Gunakan dan kelola template untuk pengisian transaksi lebih cepat.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="touch-target gap-1.5"
          >
            <Plus size={16} />
            <span>Tambah Template</span>
          </Button>
        </div>
      </div>

      {isError && (
        <Card className="border-destructive/50 bg-destructive/5 text-destructive p-4">
          Gagal memuat template. Silakan refresh halaman.
        </Card>
      )}

      {/* Search Bar (visible if 2 or more templates) */}
      {templates && templates.length > 1 && (
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari template berdasarkan nama, rekening, atau kategori..."
            className="pl-9 touch-target"
          />
        </div>
      )}

      {/* Content */}
      {!templates || templates.length === 0 ? (
        <EmptyState
          icon={<Bookmark size={48} className="text-muted-foreground/60" />}
          title="Belum ada template"
          description="Buat template untuk mempermudah dan mempercepat pencatatan transaksi Anda."
          action={
            <Button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="touch-target gap-1.5"
            >
              <Plus size={16} />
              <span>Tambah Template</span>
            </Button>
          }
        />
      ) : filteredTemplates.length === 0 ? (
        <EmptyState
          icon={<Search size={40} className="text-muted-foreground" />}
          title="Tidak ada hasil"
          description={`Tidak ada template yang cocok dengan "${search}".`}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((tpl) => {
            const isExpense = tpl.type === "expense"
            const amountText =
              tpl.amount != null ? formatCurrency(Number(tpl.amount)) : "Isi manual"

            return (
              <Card
                key={tpl.id}
                className="flex flex-col justify-between border-border transition-all hover:border-primary/40 hover:shadow-sm"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <CategoryIcon
                          iconName={tpl.categories?.icon}
                          size={18}
                          className="text-primary"
                          fallback={<Bookmark size={18} className="text-primary" />}
                        />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base font-semibold truncate">
                          {tpl.name}
                        </CardTitle>
                        <CardDescription className="text-xs truncate">
                          {tpl.accounts?.name ?? "Semua Rekening"}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge
                      variant={isExpense ? "outline" : "default"}
                      className={
                        isExpense
                          ? "border-destructive/40 text-destructive text-[11px] shrink-0"
                          : "bg-primary/20 text-primary border-primary/30 text-[11px] shrink-0"
                      }
                    >
                      {isExpense ? "Pengeluaran" : "Pemasukan"}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-1">
                  <div className="rounded-lg bg-muted/40 p-2.5">
                    <div className="text-xs text-muted-foreground">Jumlah tersimpan</div>
                    <div className="text-base font-bold text-foreground tabular-nums mt-0.5">
                      {amountText}
                    </div>
                    {tpl.categories?.name && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Kategori: <span className="font-medium text-foreground">{tpl.categories.name}</span>
                      </div>
                    )}
                  </div>

                  {tpl.tags && tpl.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tpl.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-border/60">
                    <div className="flex items-center gap-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setEditingTemplate(tpl)}
                        className="touch-target text-muted-foreground hover:text-foreground"
                        aria-label={`Edit template ${tpl.name}`}
                      >
                        <Pencil size={15} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteTarget(tpl)}
                        className="touch-target text-destructive hover:bg-destructive/10"
                        aria-label={`Hapus template ${tpl.name}`}
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => navigate(`/transactions/new?template_id=${tpl.id}`)}
                      className="touch-target gap-1 text-xs font-semibold flex-1 justify-center ml-1"
                    >
                      <span>Gunakan</span>
                      <ArrowRight size={14} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(isOpen) => {
          if (!isOpen) setDeleteTarget(null)
        }}
        title="Hapus Template"
        description={`Yakin ingin menghapus template "${deleteTarget?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
      {/* Create / Edit Template Dialog */}
      <TemplateEditDialog
        open={Boolean(editingTemplate) || isCreateOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setEditingTemplate(null)
            setIsCreateOpen(false)
          }
        }}
        template={editingTemplate}
        userId={userId}
      />
    </div>
  )
}

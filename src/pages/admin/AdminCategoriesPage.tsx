import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/services/admin.service"
import { PageLoading } from "@/components/shared/LoadingSpinner"
import { EmptyState } from "@/components/shared/EmptyState"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Plus, Pencil, Trash2, Tag } from "lucide-react"
import { toast } from "sonner"

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: "",
    type: "expense" as "income" | "expense",
    icon: "circle",
    color: "#9AB17A",
    sort_order: 0,
  })

  const { data: categories, isLoading } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: getCategories,
  })

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] })
      toast.success("Kategori berhasil ditambahkan")
      closeForm()
    },
    onError: () => toast.error("Gagal menambahkan kategori"),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateCategory>[1] }) =>
      updateCategory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] })
      toast.success("Kategori berhasil diperbarui")
      closeForm()
    },
    onError: () => toast.error("Gagal memperbarui kategori"),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] })
      toast.success("Kategori berhasil dihapus")
      setDeleteTarget(null)
    },
    onError: () => toast.error("Gagal menghapus kategori"),
  })

  function openCreate() {
    setEditingId(null)
    setForm({ name: "", type: "expense", icon: "circle", color: "#9AB17A", sort_order: 0 })
    setFormOpen(true)
  }

  function openEdit(cat: typeof categories extends (infer T)[] | undefined ? T : never) {
    setEditingId(cat.id)
    setForm({
      name: cat.name,
      type: cat.type as "income" | "expense",
      icon: cat.icon || "circle",
      color: cat.color || "#9AB17A",
      sort_order: cat.sort_order,
    })
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingId(null)
  }

  function handleSubmit() {
    if (!form.name.trim()) return
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload: form })
    } else {
      createMutation.mutate({ ...form, is_global: true })
    }
  }

  if (isLoading) return <PageLoading />

  const incomeCategories = categories?.filter((c) => c.type === "income") ?? []
  const expenseCategories = categories?.filter((c) => c.type === "expense") ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kelola Kategori</h1>
          <p className="text-sm text-muted-foreground">Kategori global untuk semua pengguna</p>
        </div>
        <Button onClick={openCreate} className="touch-target">
          <Plus size={18} className="mr-1" /> Tambah
        </Button>
      </div>

      {!categories?.length ? (
        <EmptyState icon={<Tag size={40} />} title="Belum ada kategori" />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-primary">Pemasukan ({incomeCategories.length})</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              {incomeCategories.map((cat) => (
                <CategoryRow
                  key={cat.id}
                  cat={cat}
                  onEdit={() => openEdit(cat)}
                  onDelete={() => setDeleteTarget({ id: cat.id, name: cat.name })}
                />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-destructive">Pengeluaran ({expenseCategories.length})</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              {expenseCategories.map((cat) => (
                <CategoryRow
                  key={cat.id}
                  cat={cat}
                  onEdit={() => openEdit(cat)}
                  onDelete={() => setDeleteTarget({ id: cat.id, name: cat.name })}
                />
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Kategori" : "Tambah Kategori"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="cat-name">Nama</Label>
              <Input
                id="cat-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="touch-target"
                placeholder="Contoh: Makanan"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Tipe</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v as "income" | "expense" })}
              >
                <SelectTrigger className="touch-target"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Pemasukan</SelectItem>
                  <SelectItem value="expense">Pengeluaran</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cat-icon">Ikon (Lucide)</Label>
              <Input
                id="cat-icon"
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                className="touch-target"
                placeholder="circle"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cat-color">Warna</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="h-10 w-10 cursor-pointer rounded border border-border"
                />
                <Input
                  id="cat-color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="touch-target flex-1"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cat-order">Urutan</Label>
              <Input
                id="cat-order"
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                className="touch-target"
              />
            </div>
          </div>
          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button variant="outline" onClick={closeForm} className="flex-1 touch-target sm:flex-none">
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.name.trim() || createMutation.isPending || updateMutation.isPending}
              className="flex-1 touch-target sm:flex-none"
            >
              {createMutation.isPending || updateMutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Hapus Kategori"
        description={`Yakin ingin menghapus kategori "${deleteTarget?.name}"?`}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

function CategoryRow({
  cat,
  onEdit,
  onDelete,
}: {
  cat: { id: string; name: string; icon: string | null; color: string | null; is_global: boolean; user_id: string | null }
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <>
      <div className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted/50">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: cat.color || "#9AB17A" }}
          />
          <span className="text-sm font-medium">{cat.name}</span>
          {cat.is_global && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">global</Badge>}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-xs" onClick={onEdit} className="touch-target">
            <Pencil size={14} />
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={onDelete} className="touch-target text-destructive">
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
    </>
  )
}

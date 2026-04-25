import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/services/admin.service"
import { PageLoading } from "@/components/shared/LoadingSpinner"
import { EmptyState } from "@/components/shared/EmptyState"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { FormField } from "@/components/shared/FormField"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Plus, Pencil, Trash2, Tag } from "lucide-react"
import { toast } from "sonner"
import { adminCategorySchema, type AdminCategoryInput } from "@/lib/validators"

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<AdminCategoryInput>({
    resolver: zodResolver(adminCategorySchema),
    defaultValues: { name: "", type: "expense", icon: "circle", color: "#9AB17A", sort_order: 0 },
  })

  const formType = watch("type")

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
    reset({ name: "", type: "expense", icon: "circle", color: "#9AB17A", sort_order: 0 })
    setFormOpen(true)
  }

  function openEdit(cat: typeof categories extends (infer T)[] | undefined ? T : never) {
    setEditingId(cat.id)
    reset({
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

  function onSubmit(data: AdminCategoryInput) {
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload: data })
    } else {
      createMutation.mutate({ ...data, is_global: true })
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
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-4">
              <FormField label="Nama" htmlFor="cat-name" error={errors.name}>
                <Input
                  id="cat-name"
                  placeholder="Contoh: Makanan"
                  className="touch-target"
                  {...register("name")}
                />
              </FormField>

              <FormField label="Tipe" error={errors.type}>
                <Select
                  value={formType}
                  onValueChange={(v) => setValue("type", v as "income" | "expense", { shouldValidate: true })}
                >
                  <SelectTrigger className="touch-target" aria-invalid={Boolean(errors.type)}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Pemasukan</SelectItem>
                    <SelectItem value="expense">Pengeluaran</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Ikon (Lucide)" htmlFor="cat-icon" error={errors.icon}>
                <Input
                  id="cat-icon"
                  placeholder="circle"
                  className="touch-target"
                  {...register("icon")}
                />
              </FormField>

              <FormField label="Warna" htmlFor="cat-color" error={errors.color}>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={watch("color")}
                    onChange={(e) => setValue("color", e.target.value, { shouldValidate: true })}
                    className="h-10 w-10 cursor-pointer rounded border border-border"
                  />
                  <Input
                    id="cat-color"
                    className="touch-target flex-1"
                    {...register("color")}
                  />
                </div>
              </FormField>

              <FormField label="Urutan" htmlFor="cat-order" error={errors.sort_order}>
                <Input
                  id="cat-order"
                  type="number"
                  className="touch-target"
                  {...register("sort_order", { valueAsNumber: true })}
                />
              </FormField>
            </div>
            <DialogFooter className="mt-4 flex-row gap-2 sm:justify-end">
              <Button variant="outline" onClick={closeForm} type="button" className="flex-1 touch-target sm:flex-none">
                Batal
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1 touch-target sm:flex-none"
              >
                {(createMutation.isPending || updateMutation.isPending) ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
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
  )
}

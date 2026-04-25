import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getAccountPresets,
  createAccountPreset,
  updateAccountPreset,
  deleteAccountPreset,
} from "@/services/admin.service"
import { PageLoading } from "@/components/shared/LoadingSpinner"
import { EmptyState } from "@/components/shared/EmptyState"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { FormField } from "@/components/shared/FormField"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Plus, Pencil, Trash2, ListChecks } from "lucide-react"
import { ACCOUNT_TYPES, type AccountType } from "@/lib/constants"
import { adminAccountPresetSchema, type AdminAccountPresetInput } from "@/lib/validators"
import type { Tables } from "@/types/database"
import { toast } from "sonner"

type AccountPreset = Tables<"account_presets">

const typeLabels: Record<string, string> = {
  bank: "Bank",
  ewallet: "E-Wallet",
  cash: "Tunai",
  savings: "Tabungan",
  investment: "Investasi",
  other: "Lainnya",
}

export default function AdminAccountPresetsPage() {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<AdminAccountPresetInput>({
    resolver: zodResolver(adminAccountPresetSchema),
    defaultValues: { name: "", type: "bank", icon: "wallet", color: "#9AB17A", sort_order: 0 },
  })

  const formType = watch("type")

  const { data: presets, isLoading } = useQuery({
    queryKey: ["admin", "account-presets"],
    queryFn: getAccountPresets,
  })

  const createMutation = useMutation({
    mutationFn: createAccountPreset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "account-presets"] })
      toast.success("Preset rekening berhasil ditambahkan")
      closeForm()
    },
    onError: () => toast.error("Gagal menambahkan preset"),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateAccountPreset>[1] }) =>
      updateAccountPreset(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "account-presets"] })
      toast.success("Preset rekening berhasil diperbarui")
      closeForm()
    },
    onError: () => toast.error("Gagal memperbarui preset"),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAccountPreset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "account-presets"] })
      toast.success("Preset rekening berhasil dihapus")
      setDeleteTarget(null)
    },
    onError: () => toast.error("Gagal menghapus preset"),
  })

  function openCreate() {
    setEditingId(null)
    reset({ name: "", type: "bank", icon: "wallet", color: "#9AB17A", sort_order: 0 })
    setFormOpen(true)
  }

  function openEdit(p: AccountPreset) {
    setEditingId(p.id)
    reset({
      name: p.name,
      type: p.type as AccountType,
      icon: p.icon || "wallet",
      color: p.color || "#9AB17A",
      sort_order: p.sort_order,
    })
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingId(null)
  }

  function onSubmit(data: AdminAccountPresetInput) {
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload: data })
    } else {
      createMutation.mutate(data)
    }
  }

  if (isLoading) return <PageLoading />

  const grouped = (presets ?? []).reduce<Record<string, AccountPreset[]>>((acc, p) => {
    const t = p.type
    if (!acc[t]) acc[t] = []
    acc[t].push(p)
    return acc
  }, {})

  const groupOrder = ["bank", "ewallet", "cash", "savings", "investment", "other"]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Preset Rekening</h1>
          <p className="text-sm text-muted-foreground">
            Daftar bank, e-wallet, dan opsi rekening untuk pengguna
          </p>
        </div>
        <Button onClick={openCreate} className="touch-target">
          <Plus size={18} className="mr-1" /> Tambah
        </Button>
      </div>

      {!presets?.length ? (
        <EmptyState icon={<ListChecks size={40} />} title="Belum ada preset rekening" />
      ) : (
        <div className="flex flex-col gap-4">
          {groupOrder
            .filter((t) => grouped[t]?.length)
            .map((type) => (
              <Card key={type}>
                <CardHeader>
                  <CardTitle className="text-base">{typeLabels[type] || type} ({grouped[type].length})</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-1 sm:grid-cols-2">
                  {grouped[type].map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{ backgroundColor: p.color || "#9AB17A" }}
                        />
                        <span className="text-sm font-medium">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-xs" onClick={() => openEdit(p)} className="touch-target">
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setDeleteTarget({ id: p.id, name: p.name })}
                          className="touch-target text-destructive"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Preset" : "Tambah Preset"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-4">
              <FormField label="Nama" htmlFor="preset-name" error={errors.name}>
                <Input
                  id="preset-name"
                  placeholder="Contoh: BCA"
                  className="touch-target"
                  {...register("name")}
                />
              </FormField>

              <FormField label="Tipe" error={errors.type}>
                <Select value={formType} onValueChange={(v) => setValue("type", v as AdminAccountPresetInput["type"], { shouldValidate: true })}>
                  <SelectTrigger className="touch-target" aria-invalid={Boolean(errors.type)}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{typeLabels[t] || t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Ikon (Lucide)" htmlFor="preset-icon" error={errors.icon}>
                <Input
                  id="preset-icon"
                  placeholder="wallet"
                  className="touch-target"
                  {...register("icon")}
                />
              </FormField>

              <FormField label="Warna" error={errors.color}>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={watch("color")}
                    onChange={(e) => setValue("color", e.target.value, { shouldValidate: true })}
                    className="h-10 w-10 cursor-pointer rounded border border-border"
                  />
                  <Input
                    className="touch-target flex-1"
                    {...register("color")}
                  />
                </div>
              </FormField>

              <FormField label="Urutan" htmlFor="preset-order" error={errors.sort_order}>
                <Input
                  id="preset-order"
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
        title="Hapus Preset"
        description={`Yakin ingin menghapus preset "${deleteTarget?.name}"?`}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

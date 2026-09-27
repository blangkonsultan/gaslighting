import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormField } from "@/components/shared/FormField"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { CategoryIcon } from "@/components/shared/CategoryIcon"
import { TagInput } from "@/components/transactions/TagInput"
import { formatIdrIntegerInput, parseIdrInteger } from "@/lib/money"
import { queryKeys } from "@/lib/query-client"
import { getAccounts } from "@/services/accounts.service"
import { getCategories } from "@/services/admin.service"
import { getUserTags } from "@/services/transactions.service"
import { useUpdateTemplate } from "@/hooks/useTransactionTemplates"
import type { TemplateListRow } from "@/services/transaction-templates.service"
import type { Account, Category } from "@/types/financial"

export interface TemplateEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: TemplateListRow | null
  userId: string
}

export function TemplateEditDialog({
  open,
  onOpenChange,
  template,
  userId,
}: TemplateEditDialogProps) {
  if (!template) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto p-5">
        <TemplateEditForm
          key={template.id}
          template={template}
          userId={userId}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function TemplateEditForm({
  template,
  userId,
  onClose,
}: {
  template: TemplateListRow
  userId: string
  onClose: () => void
}) {
  const [name, setName] = useState(() => template.name)
  const [type, setType] = useState<"income" | "expense">(() => template.type as "income" | "expense")
  const [accountId, setAccountId] = useState(() => template.account_id ?? "")
  const [categoryId, setCategoryId] = useState(() => template.category_id ?? "")
  const [amountStr, setAmountStr] = useState(() =>
    template.amount != null ? formatIdrIntegerInput(String(template.amount)) : ""
  )
  const [description, setDescription] = useState(() => template.description ?? "")
  const [tags, setTags] = useState<string[]>(() => template.tags ?? [])
  const [nameError, setNameError] = useState<string | null>(null)

  const updateMutation = useUpdateTemplate()

  const { data: accounts, isLoading: isAccountsLoading } = useQuery({
    queryKey: queryKeys.accounts.all,
    queryFn: async () => (await getAccounts(userId)) as Account[],
    enabled: Boolean(userId),
  })

  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: async () => (await getCategories()) as Category[],
    staleTime: 5 * 60 * 1000,
  })

  const { data: userTags } = useQuery({
    queryKey: queryKeys.transactions.tags(userId),
    queryFn: () => getUserTags(userId),
    enabled: Boolean(userId),
  })

  const categoryById = useMemo(() => {
    return new Map((categories ?? []).map((c) => [c.id, c] as const))
  }, [categories])

  const categoryLabelById = useMemo(() => {
    return new Map((categories ?? []).map((c) => [c.id, c.name] as const))
  }, [categories])

  const accountLabelById = useMemo(() => {
    return new Map((accounts ?? []).map((a) => [a.id, a.name] as const))
  }, [accounts])

  const categoryOptions = useMemo(() => {
    const all = categories ?? []
    return all.filter((c) => c.type === type)
  }, [categories, type])

  function handleTypeChange(newType: "income" | "expense") {
    setType(newType)
    if (categoryId) {
      const cat = categoryById.get(categoryId)
      if (cat && cat.type !== newType) {
        setCategoryId("")
      }
    }
  }

  async function handleSave() {
    const trimmedName = name.trim()
    if (!trimmedName) {
      setNameError("Nama template wajib diisi.")
      return
    }
    if (trimmedName.length > 30) {
      setNameError("Nama template maksimal 30 karakter.")
      return
    }
    setNameError(null)

    const parsedAmount = amountStr ? parseIdrInteger(amountStr) : null

    try {
      await updateMutation.mutateAsync({
        id: template.id,
        user_id: userId,
        name: trimmedName,
        type,
        account_id: accountId || null,
        category_id: categoryId || null,
        amount: parsedAmount && parsedAmount > 0 ? parsedAmount : null,
        description: description.trim() || null,
        tags,
      })

      toast.success("Template berhasil diperbarui.")
      onClose()
    } catch (err: unknown) {
      const errorObj = err as { code?: string; message?: string }
      if (
        errorObj.code === "23505" ||
        errorObj.message?.includes("uq_template_name_per_user") ||
        errorObj.message?.includes("duplicate key")
      ) {
        setNameError("Template dengan nama ini sudah ada.")
      } else {
        toast.error("Gagal memperbarui template.")
      }
    }
  }

  const isLoading = isAccountsLoading || isCategoriesLoading

  return (
    <>
      <DialogHeader className="text-left">
        <DialogTitle className="text-lg font-bold">Edit Template</DialogTitle>
      </DialogHeader>

      <div className="flex flex-col gap-4 py-2">
        {/* Tipe */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tipe
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={[
                "touch-target rounded-lg border-2 p-2.5 text-sm font-medium transition-colors",
                type === "expense"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50",
              ].join(" ")}
              onClick={() => handleTypeChange("expense")}
            >
              Pengeluaran
            </button>
            <button
              type="button"
              className={[
                "touch-target rounded-lg border-2 p-2.5 text-sm font-medium transition-colors",
                type === "income"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50",
              ].join(" ")}
              onClick={() => handleTypeChange("income")}
            >
              Pemasukan
            </button>
          </div>
        </div>

        {/* Nama Template */}
        <FormField label="Nama Template" htmlFor="edit-template-name" error={nameError ?? undefined}>
          <Input
            id="edit-template-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (nameError) setNameError(null)
            }}
            maxLength={30}
            placeholder="Contoh: Makan Siang Kantor"
            className="touch-target"
          />
        </FormField>

        {/* Rekening */}
        <FormField label="Rekening" htmlFor="edit-template-account">
          <Select value={accountId} onValueChange={(v) => setAccountId(v ?? "")}>
            <SelectTrigger id="edit-template-account" className="touch-target w-full" disabled={isLoading}>
              <SelectValue>
                {(v) => {
                  if (!v) return "Pilih rekening (opsional)"
                  return accountLabelById.get(String(v)) ?? String(v)
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {(accounts ?? []).map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </FormField>

        {/* Kategori */}
        <FormField label="Kategori" htmlFor="edit-template-category">
          <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
            <SelectTrigger id="edit-template-category" className="touch-target w-full" disabled={isLoading}>
              <SelectValue>
                {(v) => {
                  if (!v) return "Pilih kategori (opsional)"
                  const id = String(v)
                  const cat = categoryById.get(id)
                  if (!cat) return categoryLabelById.get(id) ?? id
                  return (
                    <span className="flex items-center gap-2">
                      <CategoryIcon
                        iconName={cat.icon}
                        size={15}
                        fallback={<span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: cat.color || "#9AB17A" }} />}
                      />
                      <span>{cat.name}</span>
                    </span>
                  )
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {categoryOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-2">
                      <span
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-foreground"
                        style={{ backgroundColor: c.color ? `${c.color}25` : undefined, color: c.color || undefined }}
                      >
                        <CategoryIcon
                          iconName={c.icon}
                          size={13}
                          fallback={<span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: c.color || "#9AB17A" }} />}
                        />
                      </span>
                      <span>{c.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </FormField>

        {/* Nominal */}
        <FormField label="Nominal (opsional)" htmlFor="edit-template-amount">
          <Input
            id="edit-template-amount"
            type="text"
            inputMode="numeric"
            value={amountStr}
            onChange={(e) => setAmountStr(formatIdrIntegerInput(e.target.value))}
            placeholder="0 (kosongkan jika isi manual tiap kali pakai)"
            className="touch-target text-right tabular-nums"
          />
        </FormField>

        {/* Deskripsi */}
        <FormField label="Deskripsi (opsional)" htmlFor="edit-template-desc">
          <Input
            id="edit-template-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Contoh: Makan siang di kantin"
            className="touch-target"
          />
        </FormField>

        {/* Tag */}
        <FormField label="Tag Transaksi">
          <TagInput
            value={tags}
            onChange={setTags}
            suggestedTags={userTags ?? []}
            disabled={isLoading}
          />
        </FormField>
      </div>

      <DialogFooter className="mt-3 flex-row gap-2 sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={updateMutation.isPending}
          className="flex-1 touch-target sm:flex-none"
        >
          Batal
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="flex-1 touch-target sm:flex-none"
        >
          {updateMutation.isPending ? (
            <>
              <LoadingSpinner className="mr-2 h-4 w-4" />
              Menyimpan...
            </>
          ) : (
            "Simpan Perubahan"
          )}
        </Button>
      </DialogFooter>
    </>
  )
}

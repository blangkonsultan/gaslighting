import { useState } from "react"
import { toast } from "sonner"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormField } from "@/components/shared/FormField"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { formatCurrency } from "@/lib/formatters"
import { useCreateTemplate } from "@/hooks/useTransactionTemplates"

export interface SaveTemplateDefaultValues {
  type: "income" | "expense"
  account_id: string
  category_id: string | null
  amount: number
  description: string
  tags: string[]
}

export interface SaveTemplateSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultValues: SaveTemplateDefaultValues | null
  userId: string
}

export function SaveTemplateSheet({
  open,
  onOpenChange,
  defaultValues,
  userId,
}: SaveTemplateSheetProps) {
  if (!defaultValues) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-2xl p-5">
        <SaveTemplateForm
          key={`${defaultValues.description}-${defaultValues.amount}-${defaultValues.type}`}
          defaultValues={defaultValues}
          userId={userId}
          onClose={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  )
}

function SaveTemplateForm({
  defaultValues,
  userId,
  onClose,
}: {
  defaultValues: SaveTemplateDefaultValues
  userId: string
  onClose: () => void
}) {
  const [name, setName] = useState(() => defaultValues.description.trim().slice(0, 30))
  const [saveAmount, setSaveAmount] = useState(true)
  const [nameError, setNameError] = useState<string | null>(null)
  const createTemplateMutation = useCreateTemplate()

  async function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) {
      setNameError("Nama template wajib diisi.")
      return
    }
    if (trimmed.length > 30) {
      setNameError("Nama template maksimal 30 karakter.")
      return
    }
    setNameError(null)

    try {
      await createTemplateMutation.mutateAsync({
        user_id: userId,
        name: trimmed,
        type: defaultValues.type,
        account_id: defaultValues.account_id || null,
        category_id: defaultValues.category_id || null,
        amount: saveAmount ? defaultValues.amount : null,
        description: defaultValues.description || null,
        tags: defaultValues.tags,
      })

      toast.success("Template berhasil disimpan.")
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
        toast.error("Gagal menyimpan template.")
      }
    }
  }

  return (
    <>
      <div className="mx-auto h-1.5 w-12 rounded-full bg-muted-foreground/30 mb-1" />
      <SheetHeader className="text-left space-y-1">
        <SheetTitle className="text-lg font-bold">Simpan Sebagai Template?</SheetTitle>
        <SheetDescription className="text-sm text-muted-foreground">
          Simpan transaksi ini sebagai template untuk penggunaan cepat di masa depan.
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-col gap-4 py-2">
        <FormField label="Nama Template" htmlFor="template-name" error={nameError ?? undefined}>
          <Input
            id="template-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (nameError) setNameError(null)
            }}
            placeholder="Contoh: Makan Siang Kantor"
            maxLength={30}
            className="touch-target"
            autoFocus
          />
        </FormField>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Simpan Jumlah?</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSaveAmount(true)}
              className={[
                "touch-target flex flex-col items-center justify-center rounded-xl border-2 p-2.5 text-center transition-colors text-xs font-medium",
                saveAmount
                  ? "border-primary bg-primary/10 text-primary font-semibold"
                  : "border-border text-muted-foreground hover:border-primary/50",
              ].join(" ")}
            >
              <span>Ya</span>
              <span className="text-[11px] tabular-nums font-semibold mt-0.5">
                {formatCurrency(defaultValues.amount)}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSaveAmount(false)}
              className={[
                "touch-target flex flex-col items-center justify-center rounded-xl border-2 p-2.5 text-center transition-colors text-xs font-medium",
                !saveAmount
                  ? "border-primary bg-primary/10 text-primary font-semibold"
                  : "border-border text-muted-foreground hover:border-primary/50",
              ].join(" ")}
            >
              <span>Tidak</span>
              <span className="text-[11px] text-muted-foreground mt-0.5">
                (isi manual)
              </span>
            </button>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="touch-target"
          >
            Lewati
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={createTemplateMutation.isPending}
            className="touch-target"
          >
            {createTemplateMutation.isPending ? (
              <>
                <LoadingSpinner className="mr-2 h-4 w-4" />
                Menyimpan...
              </>
            ) : (
              "Simpan Template"
            )}
          </Button>
        </div>
      </div>
    </>
  )
}

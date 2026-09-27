import { useNavigate, useSearchParams } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/services/supabase"
import { queryKeys } from "@/lib/query-client"
import type { TransactionInput, TransferInput } from "@/lib/validators"
import { useAuthStore } from "@/stores/auth-store"
import { TransactionForm, type TransactionFormInitialValues } from "@/components/transactions/TransactionForm"
import { parseIdrInteger } from "@/lib/money"
import { TransferForm } from "@/components/transactions/TransferForm"
import { executeTransfer } from "@/services/transfers.service"
import { ReceiptScannerModal } from "@/components/transactions/ReceiptScannerModal"
import { getCategories } from "@/services/admin.service"
import { Camera } from "lucide-react"
import { TemplatePicker } from "@/components/transactions/TemplatePicker"
import { type TemplateSubmitOptions } from "@/components/transactions/TransactionForm"
import { TemplateManageSheet } from "@/components/transactions/TemplateManageSheet"
import { useTransactionTemplates, useCreateTemplate } from "@/hooks/useTransactionTemplates"
import { todayYmd } from "@/lib/dates"
import type { TemplateListRow } from "@/services/transaction-templates.service"
import { Button } from "@/components/ui/button"
import { useQuery } from "@tanstack/react-query"
import { useState, useEffect, useRef } from "react"
export default function TransactionCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { profile } = useAuthStore()
  const [mode, setMode] = useState<"transaction" | "transfer">("transaction")
  const [searchParams] = useSearchParams()
  const [isScanModalOpen, setIsScanModalOpen] = useState(() => searchParams.get("scan") === "true")
  const [scannedInitialValues, setScannedInitialValues] = useState<TransactionFormInitialValues | undefined>(() => {
    const typeParam = searchParams.get("type")
    if (typeParam === "income" || typeParam === "expense") {
      return { type: typeParam }
    }
    return undefined
  })
  const [formKey, setFormKey] = useState(0)
  const [sharedFile, setSharedFile] = useState<File | null>(null)
  const [isManageSheetOpen, setIsManageSheetOpen] = useState(false)
  const createTemplateMutation = useCreateTemplate()
  const { data: templates } = useTransactionTemplates(profile?.id ?? "")

  const appliedTemplateRef = useRef<string | null>(null)
  useEffect(() => {
    if (searchParams.get("shared_receipt") === "1") {
      async function loadSharedReceipt() {
        try {
          if ("caches" in window) {
            const cache = await caches.open("shared-receipts")
            const response = await cache.match("/shared-receipt-latest")
            if (response) {
              const blob = await response.blob()
              const fileName = decodeURIComponent(response.headers.get("X-Shared-Name") || "shared-receipt.jpg")
              const file = new File([blob], fileName, { type: blob.type || "image/jpeg" })
              await cache.delete("/shared-receipt-latest")
              setSharedFile(file)
              setIsScanModalOpen(true)
              toast.info("Struk yang dibagikan berhasil dimuat untuk dipindai.")
            }
          }
        } catch (err) {
          console.error("Gagal membaca shared receipt dari cache:", err)
        }
      }
      void loadSharedReceipt()
    }
  }, [searchParams])
  useEffect(() => {
    const templateId = searchParams.get("template_id")
    if (templateId && templateId !== appliedTemplateRef.current && templates && templates.length > 0) {
      const found = templates.find((t) => t.id === templateId)
      if (found) {
        appliedTemplateRef.current = templateId
        handleSelectTemplate(found)
      }
    }
  }, [searchParams, templates])

  const { data: categories } = useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: getCategories,
    staleTime: 5 * 60 * 1000,
  })

  function handleApplyReceipt(data: {
    amount: string
    description: string
    transaction_date: string
    suggestedCategory?: string
    tags: string[]
  }) {
    let matchedCatId = ""
    if (data.suggestedCategory && categories) {
      const found = categories.find(
        (c) =>
          c.type === "expense" &&
          (c.name.toLowerCase().includes(data.suggestedCategory!.toLowerCase()) ||
            data.suggestedCategory!.toLowerCase().includes(c.name.toLowerCase()))
      )
      if (found) matchedCatId = found.id
    }

    setScannedInitialValues({
      type: "expense",
      amount: parseIdrInteger(data.amount),
      description: data.description,
      transaction_date: data.transaction_date,
      category_id: matchedCatId || null,
      tags: data.tags,
    })
    setFormKey((k) => k + 1)
  }
  function handleSelectTemplate(template: TemplateListRow) {
    setScannedInitialValues({
      type: template.type as "income" | "expense",
      account_id: template.account_id ?? undefined,
      category_id: template.category_id,
      amount: template.amount != null ? Number(template.amount) : undefined,
      description: template.description ?? "",
      tags: template.tags ?? [],
      transaction_date: todayYmd(),
    })
    setFormKey((k) => k + 1)
    toast.success("Template diterapkan.")
  }


  async function onSubmit(data: TransactionInput, templateOptions?: TemplateSubmitOptions) {
    if (!profile?.id) {
      navigate("/auth/login")
      throw new Error("Sesi login tidak ditemukan. Silakan login ulang.")
    }

    const amountNumber = parseIdrInteger(data.amount)
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      throw new Error("Jumlah tidak valid.")
    }

    const categoryId = data.category_id?.trim() ? data.category_id : null

    const { error: insertError } = await supabase.from("transactions").insert({
      user_id: profile.id,
      type: data.type,
      account_id: data.account_id,
      category_id: categoryId,
      amount: amountNumber,
      description: data.description.trim(),
      transaction_date: data.transaction_date,
      tags: data.tags ?? [],
    })

    if (insertError) throw insertError

    if (templateOptions?.saveAsTemplate) {
      try {
        await createTemplateMutation.mutateAsync({
          user_id: profile.id,
          name: templateOptions.templateName,
          type: data.type,
          account_id: data.account_id,
          category_id: categoryId,
          amount: templateOptions.saveAmount ? amountNumber : null,
          description: data.description.trim() || null,
          tags: data.tags ?? [],
        })
      } catch (err: unknown) {
        console.error("Gagal menyimpan template:", err)
        toast.warning("Transaksi disimpan, tetapi gagal menyimpan template.")
      }
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.recent }),
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.tags(profile.id) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.templates.all(profile.id) }),
    ])

    if (templateOptions?.saveAsTemplate) {
      toast.success("Transaksi dan template berhasil disimpan.")
    } else {
      toast.success("Transaksi berhasil ditambahkan.")
    }

    navigate("/transactions")
  }
  async function onSubmitTransfer(data: TransferInput) {
    if (!profile?.id) {
      navigate("/auth/login")
      throw new Error("Sesi login tidak ditemukan. Silakan login ulang.")
    }

    const amountNumber = parseIdrInteger(data.amount)
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      throw new Error("Jumlah tidak valid.")
    }

    await executeTransfer({
      userId: profile.id,
      fromAccountId: data.from_account_id,
      toAccountId: data.to_account_id,
      amount: amountNumber,
      description: data.description?.trim() ?? "",
      transactionDate: data.transaction_date,
      categoryId: null,
    })

    toast.success("Transfer berhasil diproses.")
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.recent }),
    ])

    navigate("/transactions")
  }

  return (
    <div className="mx-auto w-full max-w-2xl p-4 lg:p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl font-bold">Tambah Transaksi</CardTitle>
            <CardDescription>Catat pemasukan, pengeluaran, atau transfer antar rekening.</CardDescription>
          </div>
          {mode === "transaction" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="touch-target gap-1.5 border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 shrink-0 text-xs font-semibold"
              onClick={() => setIsScanModalOpen(true)}
            >
              <Camera size={16} />
              <span>Scan Struk</span>
            </Button>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={[
                "touch-target rounded-lg border-2 p-2.5 text-sm font-medium transition-colors",
                mode === "transaction"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50",
              ].join(" ")}
              onClick={() => {
                setMode("transaction")
              }}
            >
              Pemasukan / Pengeluaran
            </button>
            <button
              type="button"
              className={[
                "touch-target rounded-lg border-2 p-2.5 text-sm font-medium transition-colors",
                mode === "transfer"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50",
              ].join(" ")}
              onClick={() => {
                setMode("transfer")
              }}
            >
              Transfer
            </button>
          </div>
          {mode === "transaction" && (templates?.length ?? 0) > 0 && (
            <TemplatePicker
              templates={templates ?? []}
              onSelectTemplate={handleSelectTemplate}
              onManage={() => setIsManageSheetOpen(true)}
            />
          )}

          {profile?.id ? (
            mode === "transfer" ? (
              <TransferForm
                userId={profile.id}
                submitLabel="Proses Transfer"
                onCancel={() => navigate("/transactions")}
                onSubmit={onSubmitTransfer}
              />
            ) : (
              <TransactionForm
                key={formKey}
                userId={profile.id}
                initialValues={scannedInitialValues}
                submitLabel="Simpan"
                onCancel={() => navigate("/transactions")}
                onSubmit={onSubmit}
              />
            )
          ) : null}
        </CardContent>
      </Card>
        <ReceiptScannerModal
          open={isScanModalOpen}
          onOpenChange={(open) => {
            setIsScanModalOpen(open)
            if (!open) setSharedFile(null)
          }}
          initialFile={sharedFile}
          onApplyReceipt={handleApplyReceipt}
        />
      <TemplateManageSheet
        open={isManageSheetOpen}
        onOpenChange={setIsManageSheetOpen}
        templates={templates ?? []}
        userId={profile?.id ?? ""}
      />
    </div>
  )
}


import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/services/supabase"
import { queryKeys } from "@/lib/query-client"
import type { TransactionInput, TransferInput } from "@/lib/validators"
import { useAuthStore } from "@/stores/auth-store"
import { TransactionForm } from "@/components/transactions/TransactionForm"
import { parseIdrInteger } from "@/lib/money"
import { TransferForm } from "@/components/transactions/TransferForm"
import { executeTransfer } from "@/services/transfers.service"
import { useState } from "react"

export default function TransactionCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { profile } = useAuthStore()
  const [mode, setMode] = useState<"transaction" | "transfer">("transaction")

  async function onSubmit(data: TransactionInput) {
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
    })

    if (insertError) throw insertError

    toast.success("Transaksi berhasil ditambahkan.")
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.recent }),
    ])

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
        <CardHeader>
          <CardTitle className="text-xl font-bold">Tambah Transaksi</CardTitle>
          <CardDescription>Catat pemasukan, pengeluaran, atau transfer antar rekening.</CardDescription>
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
              onClick={() => setMode("transaction")}
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
              onClick={() => setMode("transfer")}
            >
              Transfer
            </button>
          </div>

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
                userId={profile.id}
                submitLabel="Simpan"
                onCancel={() => navigate("/transactions")}
                onSubmit={onSubmit}
              />
            )
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}


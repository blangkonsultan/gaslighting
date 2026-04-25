import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"
import { TransactionForm } from "@/components/transactions/TransactionForm"
import { queryKeys } from "@/lib/query-client"
import type { TransactionInput, TransferInput } from "@/lib/validators"
import { useAuthStore } from "@/stores/auth-store"
import { deleteTransaction, getTransactionById, updateTransaction } from "@/services/transactions.service"
import { TransferForm } from "@/components/transactions/TransferForm"
import { getTransferPair, reverseTransfer, updateTransfer } from "@/services/transfers.service"
import { parseIdrInteger } from "@/lib/money"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Trash2 } from "lucide-react"

export default function TransactionEditPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuthStore()
  const userId = profile?.id

  const txQuery = useQuery({
    queryKey: ["transactions", "detail", { userId, id }],
    queryFn: async () => {
      if (!userId || !id) return null
      return await getTransactionById(userId, id)
    },
    enabled: Boolean(userId && id),
  })

  const deleteTxMutation = useMutation({
    mutationFn: async () => {
      if (!userId) {
        navigate("/auth/login")
        throw new Error("Sesi login tidak ditemukan. Silakan login ulang.")
      }
      if (!id) throw new Error("ID transaksi tidak ditemukan.")
      await deleteTransaction(userId, id)
    },
    onSuccess: async () => {
      toast.success("Transaksi berhasil dihapus.")
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary }),
        queryClient.invalidateQueries({ queryKey: ["transactions", "detail"] }),
      ])
      navigate("/transactions")
    },
    onError: () => {
      toast.error("Gagal menghapus transaksi.")
    },
  })

  const transferPairQuery = useQuery({
    queryKey: ["transfers", "pair", { userId, transferId: txQuery.data?.transfer_id }],
    queryFn: async () => {
      const transferId = txQuery.data?.transfer_id
      if (!userId || !transferId) return null
      return await getTransferPair(userId, transferId)
    },
    enabled: Boolean(userId && txQuery.data?.type === "transfer" && txQuery.data?.transfer_id),
  })

  const reverseTransferMutation = useMutation({
    mutationFn: async () => {
      if (!userId) {
        navigate("/auth/login")
        throw new Error("Sesi login tidak ditemukan. Silakan login ulang.")
      }
      const transferId = txQuery.data?.transfer_id
      if (!transferId) throw new Error("Transfer ID tidak ditemukan.")
      await reverseTransfer(userId, transferId)
    },
    onSuccess: async () => {
      toast.success("Transfer berhasil dihapus.")
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary }),
        queryClient.invalidateQueries({ queryKey: ["transactions", "detail"] }),
        queryClient.invalidateQueries({ queryKey: ["transfers", "pair"] }),
      ])
      navigate("/transactions")
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus transfer.")
    },
  })

  async function onSubmit(data: TransactionInput) {
    if (!userId) {
      navigate("/auth/login")
      throw new Error("Sesi login tidak ditemukan. Silakan login ulang.")
    }
    if (!id) {
      throw new Error("ID transaksi tidak ditemukan.")
    }

    const existing = txQuery.data
    if (!existing) throw new Error("Transaksi tidak ditemukan.")

    if (existing.type === "transfer") {
      throw new Error("Silakan edit transfer melalui form transfer.")
    }

    const amountNumber = parseIdrInteger(data.amount)
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      throw new Error("Jumlah tidak valid.")
    }

    const categoryId = data.category_id?.trim() ? data.category_id : null

    await updateTransaction(userId, id, {
      type: data.type,
      account_id: data.account_id,
      category_id: categoryId,
      amount: amountNumber,
      description: data.description.trim(),
      transaction_date: data.transaction_date,
    })

    toast.success("Transaksi berhasil diperbarui.")
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary }),
      queryClient.invalidateQueries({ queryKey: ["transactions", "detail"] }),
    ])

    navigate("/transactions")
  }

  async function onSubmitTransfer(data: TransferInput) {
    if (!userId) {
      navigate("/auth/login")
      throw new Error("Sesi login tidak ditemukan. Silakan login ulang.")
    }
    const transferId = txQuery.data?.transfer_id
    if (!transferId) throw new Error("Transfer ID tidak ditemukan.")

    const amountNumber = parseIdrInteger(data.amount)
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      throw new Error("Jumlah tidak valid.")
    }

    await updateTransfer({
      userId,
      transferId,
      fromAccountId: data.from_account_id,
      toAccountId: data.to_account_id,
      amount: amountNumber,
      description: data.description?.trim() ?? "",
      transactionDate: data.transaction_date,
      categoryId: null,
    })

    toast.success("Transfer berhasil diperbarui.")
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary }),
      queryClient.invalidateQueries({ queryKey: ["transactions", "detail"] }),
      queryClient.invalidateQueries({ queryKey: ["transfers", "pair"] }),
    ])

    navigate("/transactions")
  }

  if (!userId) {
    return (
      <EmptyState
        title="Sesi login tidak ditemukan"
        description="Silakan login ulang untuk mengedit transaksi."
        action={
          <Button onClick={() => navigate("/auth/login")} className="touch-target">
            Login
          </Button>
        }
      />
    )
  }

  if (txQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Memuat…</p>
  }

  if (txQuery.isError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
        Gagal memuat transaksi.
      </div>
    )
  }

  const tx = txQuery.data
  if (!tx) {
    return (
      <EmptyState
        title="Transaksi tidak ditemukan"
        description="Transaksi ini mungkin sudah dihapus."
        action={
          <Button onClick={() => navigate("/transactions")} className="touch-target">
            Kembali
          </Button>
        }
      />
    )
  }

  if (tx.type === "transfer") {
    const pair = transferPairQuery.data
    if (transferPairQuery.isLoading) return <p className="text-sm text-muted-foreground">Memuat…</p>
    if (transferPairQuery.isError || !pair) {
      return (
        <EmptyState
          title="Transfer tidak ditemukan"
          description="Data transfer tidak lengkap atau sudah dihapus."
          action={
            <Button onClick={() => navigate("/transactions")} className="touch-target" variant="outline">
              Kembali
            </Button>
          }
        />
      )
    }

    return (
      <div className="mx-auto w-full max-w-2xl p-4 lg:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Edit Transfer</CardTitle>
            <CardDescription>Perbarui detail transfer antar rekening.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <TransferForm
              userId={userId}
              submitLabel="Simpan Perubahan"
              onCancel={() => navigate("/transactions")}
              initialValues={{
                from_account_id: pair.fromAccountId,
                to_account_id: pair.toAccountId,
                amount: pair.amount,
                description: pair.description,
                transaction_date: pair.transactionDate,
              }}
              onSubmit={onSubmitTransfer}
            />

            <div className="flex w-full flex-col gap-2">
              <Dialog>
                <DialogTrigger
                  render={
                    <Button
                      variant="destructive"
                      className="touch-target w-full"
                      disabled={reverseTransferMutation.isPending}
                    />
                  }
                >
                  <Trash2 aria-hidden="true" />
                  Hapus Transfer
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Hapus transfer?</DialogTitle>
                    <DialogDescription>
                      Tindakan ini tidak bisa dibatalkan. Saldo kedua rekening akan disesuaikan kembali.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose render={<Button variant="outline" />}>Batal</DialogClose>
                    <Button
                      variant="destructive"
                      onClick={() => reverseTransferMutation.mutate()}
                      disabled={reverseTransferMutation.isPending}
                    >
                      {reverseTransferMutation.isPending ? "Menghapus…" : "Hapus"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl p-4 lg:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Edit Transaksi</CardTitle>
          <CardDescription>Perbarui detail transaksi.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <TransactionForm
            userId={userId}
            submitLabel="Simpan Perubahan"
            onCancel={() => navigate("/transactions")}
            initialValues={{
              type: tx.type as "income" | "expense",
              account_id: tx.account_id,
              category_id: tx.category_id,
              amount: tx.amount,
              description: tx.description,
              transaction_date: tx.transaction_date,
            }}
            onSubmit={onSubmit}
          />

          <div className="flex w-full flex-col gap-2">
            <Dialog>
              <DialogTrigger
                render={
                  <Button
                    variant="destructive"
                    className="touch-target w-full"
                    disabled={deleteTxMutation.isPending}
                  />
                }
              >
                <Trash2 aria-hidden="true" />
                Hapus Transaksi
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Hapus transaksi?</DialogTitle>
                  <DialogDescription>
                    Tindakan ini tidak bisa dibatalkan. Saldo rekening akan disesuaikan otomatis.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose render={<Button variant="outline" />}>Batal</DialogClose>
                  <Button
                    variant="destructive"
                    onClick={() => deleteTxMutation.mutate()}
                    disabled={deleteTxMutation.isPending}
                  >
                    {deleteTxMutation.isPending ? "Menghapus…" : "Hapus"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


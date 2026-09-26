import { supabase } from "./supabase"
import { t } from "@/lib/i18n"

export type ExecuteTransferInput = {
  userId: string
  fromAccountId: string
  toAccountId: string
  amount: number
  description?: string
  transactionDate: string
  categoryId?: string | null
}

export type UpdateTransferInput = ExecuteTransferInput & {
  transferId: string
}

export type TransferPair = {
  transferId: string
  fromTransactionId: string
  toTransactionId: string
  fromAccountId: string
  toAccountId: string
  amount: number
  description: string
  transactionDate: string
}

function normalizeSupabaseErrorMessage(err: unknown): string {
  if (!err) return ""
  if (typeof err === "string") return err
  if (typeof err === "object" && "message" in err) {
    const msg = err.message
    if (typeof msg === "string") return msg
  }
  return ""
}

function mapTransferErrorToMessage(err: unknown): string {
  const msg = normalizeSupabaseErrorMessage(err)

  if (!msg) return t.err_transfer_failed
  if (msg.includes("Cannot transfer to the same account")) return t.err_transfer_same_account
  if (msg.includes("Insufficient balance to reverse")) return t.err_transfer_insufficient_balance_reverse
  if (msg.includes("Insufficient balance")) return t.err_transfer_insufficient_balance
  if (msg.includes("Source account not found")) return t.err_transfer_source_not_found
  if (msg.includes("Destination account not found")) return t.err_transfer_dest_not_found
  if (msg.includes("Transfer not found")) return t.err_transfer_not_found
  return msg
}

export async function executeTransfer(input: ExecuteTransferInput): Promise<string> {
  const { data, error } = await supabase.rpc("execute_transfer", {
    p_user_id: input.userId,
    p_from_account_id: input.fromAccountId,
    p_to_account_id: input.toAccountId,
    p_amount: input.amount,
    p_description: input.description ?? "",
    p_transaction_date: input.transactionDate,
    p_category_id: input.categoryId ?? undefined,
  })

  if (error) {
    throw new Error(mapTransferErrorToMessage(error))
  }

  if (!data) {
    throw new Error("Gagal memproses transfer.")
  }

  return String(data)
}

export async function updateTransfer(input: UpdateTransferInput): Promise<void> {
  const { error } = await supabase.rpc("update_transfer", {
    p_user_id: input.userId,
    p_transfer_id: input.transferId,
    p_from_account_id: input.fromAccountId,
    p_to_account_id: input.toAccountId,
    p_amount: input.amount,
    p_description: input.description ?? "",
    p_transaction_date: input.transactionDate,
    p_category_id: input.categoryId ?? undefined,
  })

  if (error) throw new Error(mapTransferErrorToMessage(error))
}

export async function reverseTransfer(userId: string, transferId: string): Promise<void> {
  const { error } = await supabase.rpc("reverse_transfer", {
    p_user_id: userId,
    p_transfer_id: transferId,
  })
  if (error) throw new Error(mapTransferErrorToMessage(error))
}

export async function getTransferPair(userId: string, transferId: string): Promise<TransferPair | null> {
  const { data, error } = await supabase
    .from("transactions")
    .select("id,account_id,amount,description,transaction_date,transfer_id")
    .eq("user_id", userId)
    .eq("transfer_id", transferId)
    .eq("type", "transfer")

  if (error) throw error
  const rows = (data ?? []) as Array<{
    id: string
    account_id: string
    amount: number
    description: string | null
    transaction_date: string
    transfer_id: string | null
  }>

  const out = rows.find((r) => (r.description ?? "").toLowerCase().includes("transfer keluar"))
  const inc = rows.find((r) => (r.description ?? "").toLowerCase().includes("transfer masuk"))
  if (!out || !inc || !out.transfer_id) return null

  const description = (out.description ?? "")
    .replace(/^Transfer keluar:\s*/i, "")
    .trim()

  return {
    transferId: out.transfer_id,
    fromTransactionId: out.id,
    toTransactionId: inc.id,
    fromAccountId: out.account_id,
    toAccountId: inc.account_id,
    amount: out.amount,
    description,
    transactionDate: out.transaction_date,
  }
}


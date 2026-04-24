import { supabase } from "./supabase"
import type { Bill } from "@/types/financial"

export type BillListRow = Pick<
  Bill,
  | "id"
  | "name"
  | "amount"
  | "type"
  | "frequency"
  | "next_date"
  | "end_date"
  | "description"
  | "is_active"
  | "status"
  | "last_processed_at"
  | "created_at"
> & {
  accounts?: { name: string } | null
  categories?: { name: string } | null
}

export async function getBills(userId: string): Promise<BillListRow[]> {
  const { data, error } = await supabase
    .from("bills")
    .select(
      "id,name,amount,type,frequency,next_date,end_date,description,is_active,status,last_processed_at,created_at,accounts(name),categories(name)"
    )
    .eq("user_id", userId)
    .order("is_active", { ascending: false })
    .order("next_date", { ascending: true })
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data ?? []) as BillListRow[]
}

export type CreateBillInput = {
  user_id: string
  account_id: string
  category_id: string | null
  name: string
  amount: number
  type: "expense"
  frequency: "daily" | "weekly" | "monthly" | "yearly"
  next_date: string
  end_date: string | null
  description: string | null
}

export async function createBill(input: CreateBillInput): Promise<{ id: string }> {
  const { data, error } = await supabase.from("bills").insert(input).select("id").single()
  if (error) throw error
  if (!data?.id) throw new Error("Gagal mendapatkan ID auto-debit.")
  return { id: data.id }
}

export async function setBillActive(userId: string, billId: string, isActive: boolean): Promise<void> {
  const status = isActive ? "active" : "paused"
  const { error } = await supabase
    .from("bills")
    .update({ is_active: isActive, status })
    .eq("user_id", userId)
    .eq("id", billId)

  if (error) throw error
}

export async function deleteBill(userId: string, billId: string): Promise<void> {
  const { error } = await supabase
    .from("bills")
    .delete()
    .eq("user_id", userId)
    .eq("id", billId)

  if (error) throw error
}


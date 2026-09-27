import { supabase } from "./supabase"
import type { TransactionTemplate } from "@/types/financial"

export type TemplateListRow = Pick<
  TransactionTemplate,
  | "id"
  | "name"
  | "type"
  | "amount"
  | "description"
  | "tags"
  | "account_id"
  | "category_id"
  | "sort_order"
> & {
  accounts?: { name: string; icon: string | null; color: string | null } | null
  categories?: { name: string; icon: string | null; color: string | null } | null
}

export type CreateTemplateInput = {
  user_id: string
  name: string
  type: "income" | "expense"
  account_id?: string | null
  category_id?: string | null
  amount?: number | null
  description?: string | null
  tags?: string[]
}

export async function getTemplates(userId: string): Promise<TemplateListRow[]> {
  const { data, error } = await supabase
    .from("transaction_templates")
    .select(
      "id,name,type,amount,description,tags,account_id,category_id,sort_order,accounts(name,icon,color),categories(name,icon,color)"
    )
    .eq("user_id", userId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as TemplateListRow[]
}

export async function createTemplate(input: CreateTemplateInput): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from("transaction_templates")
    .insert(input)
    .select("id")
    .single()

  if (error) throw error
  if (!data?.id) throw new Error("Gagal menyimpan template.")
  return { id: data.id }
}

export async function deleteTemplate(userId: string, templateId: string): Promise<void> {
  const { error } = await supabase
    .from("transaction_templates")
    .delete()
    .eq("user_id", userId)
    .eq("id", templateId)

  if (error) throw error
}

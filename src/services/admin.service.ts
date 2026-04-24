import { supabase } from "./supabase"

export async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("type")
    .order("sort_order")
  if (error) throw error
  return data
}

export async function createCategory(payload: {
  name: string
  type: "income" | "expense"
  icon?: string
  color?: string
  is_global: boolean
  sort_order?: number
}) {
  const { data, error } = await supabase
    .from("categories")
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCategory(id: string, payload: {
  name?: string
  icon?: string
  color?: string
  sort_order?: number
  is_global?: boolean
}) {
  const { data, error } = await supabase
    .from("categories")
    .update(payload)
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteCategory(id: string) {
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
  if (error) throw error
}

export async function getAccountPresets() {
  const { data, error } = await supabase
    .from("account_presets")
    .select("*")
    .order("sort_order")
  if (error) throw error
  return data
}

export async function createAccountPreset(payload: {
  name: string
  type: string
  icon?: string
  color?: string
  sort_order?: number
}) {
  const { data, error } = await supabase
    .from("account_presets")
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateAccountPreset(id: string, payload: {
  name?: string
  type?: string
  icon?: string
  color?: string
  sort_order?: number
}) {
  const { data, error } = await supabase
    .from("account_presets")
    .update(payload)
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteAccountPreset(id: string) {
  const { error } = await supabase
    .from("account_presets")
    .delete()
    .eq("id", id)
  if (error) throw error
}

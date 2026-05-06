import { supabase } from "./supabase"
import type { BalanceRecalcPreview, BalanceRecalcResult } from "@/types/financial"

export async function getBalanceRecalcPreview(userId: string): Promise<BalanceRecalcPreview[]> {
  const { data, error } = await supabase.rpc("get_balance_recalculation_preview" as any, {
    p_user_id: userId,
  })

  if (error) throw error

  const result = data as unknown as Record<string, BalanceRecalcPreview>
  return Object.values(result ?? {})
}

export async function applyBalanceRecalculation(userId: string): Promise<BalanceRecalcResult> {
  const { data, error } = await supabase.rpc("recalculate_account_balances" as any, {
    p_user_id: userId,
  })

  if (error) throw error

  const result = data as unknown as BalanceRecalcResult
  return result
}

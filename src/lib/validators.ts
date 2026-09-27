import { z } from "zod"
import { todayYmd } from "@/lib/dates"
import { isIdrIntegerString, parseIdrInteger } from "@/lib/money"
import { t } from "@/lib/i18n"

export const loginSchema = z.object({
  email: z.string().email(t.val_email_invalid),
  password: z.string().min(6, t.val_password_min),
})

export type LoginInput = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  email: z.string().email(t.val_email_invalid),
  password: z.string().min(6, t.val_password_min),
  full_name: z.string().min(1, t.val_name_required),
})

export type RegisterInput = z.infer<typeof registerSchema>

export const onboardingAccountSchema = z.object({
  name: z.string().min(1, t.val_account_name_required),
  type: z.enum(["bank", "ewallet", "cash", "savings", "investment", "other"], {
    message: t.val_account_type_required,
  }),
  initial_balance: z
    .string()
    .min(1, t.val_initial_balance_required)
    .refine((val) => isIdrIntegerString(val), t.val_balance_format_invalid)
    .refine((val) => parseIdrInteger(val) >= 0, t.val_balance_negative),
})

export type OnboardingAccountInput = z.infer<typeof onboardingAccountSchema>

export const accountSchema = z.object({
  name: z.string().min(1, t.val_account_name_required),
  type: z.enum(["bank", "ewallet", "cash", "savings", "investment", "other"]),
  initial_balance: z
    .string()
    .min(1, t.val_balance_required)
    .refine((val) => isIdrIntegerString(val), t.val_balance_format_invalid)
    .refine((val) => parseIdrInteger(val) >= 0, t.val_balance_not_negative),
  notes: z.string().optional(),
})

export type AccountInput = z.infer<typeof accountSchema>

export const transactionSchema = z.object({
  account_id: z.string().uuid(t.val_account_required),
  category_id: z.string().uuid(t.val_category_required),
  type: z.enum(["income", "expense"]),
  amount: z
    .string()
    .min(1, t.val_amount_required)
    .refine((val) => isIdrIntegerString(val), t.val_amount_format_invalid)
    .refine((val) => parseIdrInteger(val) > 0, t.val_amount_positive),
  description: z.string().min(1, t.val_description_required),
  transaction_date: z
    .string()
    .min(1, t.val_date_required)
    .refine((v) => v <= todayYmd(), t.val_date_max_today),
  tags: z.array(z.string()).default([]),
})

export type TransactionInput = z.infer<typeof transactionSchema>
export type TransactionFormValues = z.input<typeof transactionSchema>

export const transferSchema = z.object({
  from_account_id: z.string().uuid(t.val_from_account_required),
  to_account_id: z.string().uuid(t.val_to_account_required),
  amount: z
    .string()
    .min(1, t.val_amount_required)
    .refine((val) => isIdrIntegerString(val), t.val_amount_format_invalid)
    .refine((val) => parseIdrInteger(val) > 0, t.val_amount_positive),
  description: z.string().optional(),
  transaction_date: z
    .string()
    .min(1, t.val_date_required)
    .refine((v) => v <= todayYmd(), t.val_date_max_today),
}).refine((v) => v.from_account_id !== v.to_account_id, {
  message: t.val_same_account_error,
  path: ["to_account_id"],
})

export type TransferInput = z.infer<typeof transferSchema>

export const billSchema = z.object({
  account_id: z.string().uuid(t.val_account_required),
  category_id: z.string().uuid(t.val_category_required).optional().or(z.literal("")),
  name: z.string().min(1, t.val_bill_name_required),
  amount: z
    .string()
    .min(1, t.val_amount_required)
    .refine((val) => isIdrIntegerString(val), t.val_amount_format_invalid)
    .refine((val) => parseIdrInteger(val) > 0, t.val_amount_positive),
  type: z.literal("expense"),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
  next_date: z
    .string()
    .min(1, t.val_date_required)
    .refine((v) => v >= todayYmd(), t.val_bill_start_date_min_today),
  can_end: z.boolean().optional(),
  end_date: z.string().optional(),
  description: z.string().optional(),
})

export type BillInput = z.infer<typeof billSchema>

export const adminCategorySchema = z.object({
  name: z.string().min(1, t.val_category_name_required),
  type: z.enum(["income", "expense"]),
  icon: z.string().min(1, t.val_icon_required),
  color: z.string().min(1, t.val_color_required),
  sort_order: z.number().int().min(0),
})

export type AdminCategoryInput = z.infer<typeof adminCategorySchema>

export const adminAccountPresetSchema = z.object({
  name: z.string().min(1, t.val_preset_name_required),
  type: z.enum(["bank", "ewallet", "cash", "savings", "investment", "other"]),
  icon: z.string().min(1, t.val_icon_required),
  color: z.string().min(1, t.val_color_required),
  sort_order: z.number().int().min(0),
})

export type AdminAccountPresetInput = z.infer<typeof adminAccountPresetSchema>

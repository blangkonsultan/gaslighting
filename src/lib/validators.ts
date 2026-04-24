import { z } from "zod"
import { isIdrIntegerString, parseIdrInteger } from "@/lib/money"

function todayYmd(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
})

export type LoginInput = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  full_name: z.string().min(1, "Nama lengkap wajib diisi"),
})

export type RegisterInput = z.infer<typeof registerSchema>

export const onboardingAccountSchema = z.object({
  name: z.string().min(1, "Nama rekening wajib diisi"),
  type: z.enum(["bank", "ewallet", "cash", "savings", "investment", "other"], {
    message: "Pilih tipe rekening",
  }),
  initial_balance: z
    .string()
    .min(1, "Saldo awal wajib diisi")
    .refine((val) => isIdrIntegerString(val), "Format saldo tidak valid. Contoh: 150.000.000")
    .refine((val) => parseIdrInteger(val) >= 0, "Saldo awal tidak boleh negatif"),
})

export type OnboardingAccountInput = z.infer<typeof onboardingAccountSchema>

export const accountSchema = z.object({
  name: z.string().min(1, "Nama rekening wajib diisi"),
  type: z.enum(["bank", "ewallet", "cash", "savings", "investment", "other"]),
  initial_balance: z
    .string()
    .min(1, "Saldo wajib diisi")
    .refine((val) => isIdrIntegerString(val), "Format saldo tidak valid. Contoh: 150.000.000")
    .refine((val) => parseIdrInteger(val) >= 0, "Saldo tidak boleh negatif"),
  notes: z.string().optional(),
})

export type AccountInput = z.infer<typeof accountSchema>

export const transactionSchema = z.object({
  account_id: z.string().uuid("Pilih rekening"),
  category_id: z.string().uuid("Pilih kategori"),
  type: z.enum(["income", "expense"]),
  amount: z
    .string()
    .min(1, "Jumlah wajib diisi")
    .refine((val) => isIdrIntegerString(val), "Format jumlah tidak valid. Contoh: 150.000.000")
    .refine((val) => parseIdrInteger(val) > 0, "Jumlah harus lebih dari 0"),
  description: z.string().min(1, "Deskripsi wajib diisi"),
  transaction_date: z.string().min(1, "Tanggal wajib diisi"),
})

export type TransactionInput = z.infer<typeof transactionSchema>

export const transferSchema = z.object({
  from_account_id: z.string().uuid("Pilih rekening asal"),
  to_account_id: z.string().uuid("Pilih rekening tujuan"),
  amount: z
    .string()
    .min(1, "Jumlah wajib diisi")
    .refine((val) => isIdrIntegerString(val), "Format jumlah tidak valid. Contoh: 150.000.000")
    .refine((val) => parseIdrInteger(val) > 0, "Jumlah harus lebih dari 0"),
  description: z.string().optional(),
  transaction_date: z.string().min(1, "Tanggal wajib diisi"),
}).refine((v) => v.from_account_id !== v.to_account_id, {
  message: "Rekening asal dan tujuan tidak boleh sama",
  path: ["to_account_id"],
})

export type TransferInput = z.infer<typeof transferSchema>

export const billSchema = z.object({
  account_id: z.string().uuid("Pilih rekening"),
  category_id: z.string().uuid("Pilih kategori").optional().or(z.literal("")),
  name: z.string().min(1, "Nama tagihan wajib diisi"),
  amount: z
    .string()
    .min(1, "Jumlah wajib diisi")
    .refine((val) => isIdrIntegerString(val), "Format jumlah tidak valid. Contoh: 150.000.000")
    .refine((val) => parseIdrInteger(val) > 0, "Jumlah harus lebih dari 0"),
  type: z.literal("expense"),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
  next_date: z
    .string()
    .min(1, "Tanggal wajib diisi")
    .refine((v) => v >= todayYmd(), "Tanggal mulai minimal hari ini"),
  can_end: z.boolean().optional(),
  end_date: z.string().optional(),
  description: z.string().optional(),
})

export type BillInput = z.infer<typeof billSchema>

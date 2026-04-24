export const COLORS = {
  primary: "#9AB17A",
  secondary: "#C3CC9B",
  background: "#FBE8CE",
  card: "#E4DFB5",
} as const

export const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
} as const

export const ACCOUNT_TYPES = ["bank", "ewallet", "cash", "savings", "investment", "other"] as const
export type AccountType = (typeof ACCOUNT_TYPES)[number]

export const TRANSACTION_TYPES = ["income", "expense", "transfer"] as const
export type TransactionType = (typeof TRANSACTION_TYPES)[number]

export const BILL_FREQUENCIES = ["daily", "weekly", "monthly", "yearly"] as const
export type BillFrequency = (typeof BILL_FREQUENCIES)[number]

export const PAGINATION = {
  mobile: 20,
  desktop: 50,
} as const

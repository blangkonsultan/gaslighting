import type { TransactionListRow } from "@/services/transactions.service"
import { formatCurrency } from "@/lib/formatters"

export function escapeCsvField(field: unknown): string {
  if (field === null || field === undefined) return ""
  let str = String(field)

  // Prevent CSV Formula Injection (CWE-1236)
  // If text starts with formula triggers and is not a pure number, prepend single quote
  if (/^[=+\-@\t\r]/.test(str) && !/^[-+]?\d+(\.\d+)?$/.test(str.trim())) {
    str = `'${str}`
  }

  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function formatTransactionType(type: string): string {
  switch (type) {
    case "income":
      return "Pemasukan"
    case "expense":
      return "Pengeluaran"
    case "transfer":
      return "Transfer"
    default:
      return type
  }
}

export interface CsvExportOptions {
  monthKey?: string
  includeSummary?: boolean
}

export function generateTransactionsCsv(
  transactions: TransactionListRow[],
  options: CsvExportOptions = {}
): string {
  const headers = [
    "Tanggal",
    "Tipe",
    "Rekening",
    "Kategori",
    "Deskripsi",
    "Nominal",
    "Format Nominal",
  ]

  const rows: string[] = [headers.join(",")]

  let totalIncome = 0
  let totalExpense = 0

  for (const tx of transactions) {
    const typeLabel = formatTransactionType(tx.type)
    const accountName = tx.accounts?.name || "-"
    const categoryName = tx.categories?.name || "-"
    const description = tx.description || "-"
    const formattedAmount = formatCurrency(tx.amount)

    if (tx.type === "income") totalIncome += tx.amount
    if (tx.type === "expense") totalExpense += tx.amount

    const row = [
      escapeCsvField(tx.transaction_date),
      escapeCsvField(typeLabel),
      escapeCsvField(accountName),
      escapeCsvField(categoryName),
      escapeCsvField(description),
      escapeCsvField(tx.amount),
      escapeCsvField(formattedAmount),
    ]

    rows.push(row.join(","))
  }

  if (options.includeSummary) {
    const net = totalIncome - totalExpense
    rows.push("")
    rows.push(`"--- RINGKASAN ---"`)
    rows.push(`Total Pemasukan,,,,,${totalIncome},${escapeCsvField(formatCurrency(totalIncome))}`)
    rows.push(`Total Pengeluaran,,,,,${totalExpense},${escapeCsvField(formatCurrency(totalExpense))}`)
    rows.push(`Arus Kas Bersih,,,,,${net},${escapeCsvField(formatCurrency(net))}`)
  }

  // Prepend UTF-8 BOM (\uFEFF) for Excel compatibility
  return "\uFEFF" + rows.join("\r\n")
}

export function downloadCsvFile(filename: string, csvContent: string): void {
  if (typeof window === "undefined") return

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

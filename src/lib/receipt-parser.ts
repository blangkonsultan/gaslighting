import { todayYmd } from "@/lib/dates"

export interface ParsedReceipt {
  merchant: string | null
  amount: number | null
  date: string | null
  suggestedCategory: string | null
  rawText: string
  confidence: {
    amount: boolean
    date: boolean
    merchant: boolean
  }
}

const KNOWN_MERCHANT_PATTERNS: Array<{
  pattern: RegExp
  name: string
  category: string
}> = [
  { pattern: /indomaret|indomarco/i, name: "Indomaret", category: "Belanja" },
  { pattern: /alfamart|sumber alfaria/i, name: "Alfamart", category: "Belanja" },
  { pattern: /alfamidi|midi utama/i, name: "Alfamidi", category: "Belanja" },
  { pattern: /super\s*indo|lion super indo/i, name: "Super Indo", category: "Belanja" },
  { pattern: /hypermart/i, name: "Hypermart", category: "Belanja" },
  { pattern: /transmart|carrefour/i, name: "Transmart", category: "Belanja" },
  { pattern: /starbucks/i, name: "Starbucks", category: "Makanan" },
  { pattern: /kopi\s*kenangan/i, name: "Kopi Kenangan", category: "Makanan" },
  { pattern: /janji\s*jiwa/i, name: "Janji Jiwa", category: "Makanan" },
  { pattern: /fore\s*coffee/i, name: "Fore Coffee", category: "Makanan" },
  { pattern: /chatime/i, name: "Chatime", category: "Makanan" },
  { pattern: /mcdonald'?s|mcd/i, name: "McDonald's", category: "Makanan" },
  { pattern: /kfc|kentucky fried chicken/i, name: "KFC", category: "Makanan" },
  { pattern: /hokben|hoka hoka bento/i, name: "HokBen", category: "Makanan" },
  { pattern: /pertamina|spbu/i, name: "Pertamina SPBU", category: "Transportasi" },
  { pattern: /shell/i, name: "Shell SPBU", category: "Transportasi" },
  { pattern: /apotek\s*k-?24/i, name: "Apotek K-24", category: "Kesehatan" },
  { pattern: /kimia\s*farma/i, name: "Kimia Farma", category: "Kesehatan" },
  { pattern: /guardian/i, name: "Guardian", category: "Kesehatan" },
  { pattern: /watsons/i, name: "Watsons", category: "Kesehatan" },
  { pattern: /gramedia/i, name: "Gramedia", category: "Pendidikan" },
]

const MONTH_NAMES_ID: Record<string, string> = {
  jan: "01", januari: "01",
  feb: "02", februari: "02",
  mar: "03", maret: "03",
  apr: "04", april: "04",
  mei: "05", may: "05",
  jun: "06", juni: "06",
  jul: "07", juli: "07",
  agu: "08", agustus: "08", aug: "08",
  sep: "09", september: "09",
  okt: "10", oktober: "10", oct: "10",
  nop: "11", november: "11", nov: "11",
  des: "12", desember: "12", dec: "12",
}

export function cleanNumericString(raw: string): number | null {
  // Remove currency prefixes like "Rp", "Rp.", "IDR", spaces
  let s = raw.replace(/(?:rp\.?|idr|\$)\s*/gi, "").trim()

  // Match standard Indonesian number formats:
  // e.g. 125.000 or 125.000,00 or 125000 or 125,000.00
  if (/\d+\.\d{3},\d{2}$/.test(s)) {
    // 125.000,00 -> 125000
    s = s.replace(/\./g, "").replace(/,\d{2}$/, "")
  } else if (/\d+,\d{3}\.\d{2}$/.test(s)) {
    // 125,000.00 -> 125000
    s = s.replace(/,/g, "").replace(/\.\d{2}$/, "")
  } else if (/\d+\.\d{3}$/.test(s)) {
    // 125.000 -> 125000
    s = s.replace(/\./g, "")
  } else if (/\d+,\d{3}$/.test(s)) {
    // 125,000 -> 125000
    s = s.replace(/,/g, "")
  }

  // Remove any remaining non-digits
  s = s.replace(/[^\d]/g, "")
  const n = parseInt(s, 10)
  return Number.isFinite(n) && n > 0 ? n : null
}

export function extractMerchant(lines: string[]): { name: string; category?: string } | null {
  const fullText = lines.join(" ")

  // 1. Try matching known merchant patterns across full text
  for (const item of KNOWN_MERCHANT_PATTERNS) {
    if (item.pattern.test(fullText)) {
      return { name: item.name, category: item.category }
    }
  }

  // 2. Fallback: Check first 4 non-empty lines for plausible title
  const ignorePatterns = [
    /struk/i,
    /selamat datang/i,
    /jl\./i,
    /jalan/i,
    /telp/i,
    /npwp/i,
    /nomor/i,
    /no\./i,
    /kasir/i,
    /tanggal/i,
    /waktu/i,
    /receipt/i,
    /tax invoice/i,
  ]

  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i].trim()
    if (!line || line.length < 3 || line.length > 40) continue
    if (ignorePatterns.some((re) => re.test(line))) continue
    // If it's mostly uppercase or letters
    if (/[a-zA-Z]{3,}/.test(line) && !/\d{5,}/.test(line)) {
      return { name: line }
    }
  }

  return null
}

export function extractDate(lines: string[]): string | null {
  const text = lines.join(" ")
  const today = todayYmd()

  // Pattern 1: YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = text.match(/\b(20\d{2})[-/](0[1-9]|1[0-2])[-/](0[1-9]|[12]\d|3[01])\b/)
  if (isoMatch) {
    const ymd = `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`
    if (ymd <= today) return ymd
  }

  // Pattern 2: DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = text.match(/\b(0[1-9]|[12]\d|3[01])[-/.](0[1-9]|1[0-2])[-/.](20\d{2})\b/)
  if (dmyMatch) {
    const ymd = `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`
    if (ymd <= today) return ymd
  }

  // Pattern 3: DD MonthName YYYY (e.g. 27 Sep 2026 or 27-September-2026)
  const monthRegex = new RegExp(
    `\\b(0?[1-9]|[12]\\d|3[01])[-/\\s]+(${Object.keys(MONTH_NAMES_ID).join("|")})[-/\\s]+(20\\d{2})\\b`,
    "i"
  )
  const nameMatch = text.match(monthRegex)
  if (nameMatch) {
    const day = nameMatch[1].padStart(2, "0")
    const monthKey = nameMatch[2].toLowerCase()
    const month = MONTH_NAMES_ID[monthKey]
    const year = nameMatch[3]
    if (month) {
      const ymd = `${year}-${month}-${day}`
      if (ymd <= today) return ymd
    }
  }

  // Pattern 4: DD/MM/YY (short year e.g. 27/09/26)
  const shortYearMatch = text.match(/\b(0[1-9]|[12]\d|3[01])[-/.](0[1-9]|1[0-2])[-/.](2[4-9])\b/)
  if (shortYearMatch) {
    const ymd = `20${shortYearMatch[3]}-${shortYearMatch[2]}-${shortYearMatch[1]}`
    if (ymd <= today) return ymd
  }

  return null
}

export function extractTotalAmount(lines: string[]): number | null {
  // Strategy A: Look for lines explicitly mentioning TOTAL / JUMLAH / GRAND TOTAL
  const totalKeywords = [
    /grand\s*total/i,
    /total\s*akhir/i,
    /total\s*belanja/i,
    /total\s*harga/i,
    /total\s*bayar/i,
    /jumlah\s*total/i,
    /jumlah\s*bayar/i,
    /tagihan/i,
    /\btotal\b/i,
    /\bjumlah\b/i,
  ]

  // Scan from bottom to top for total keywords (totals appear near the bottom of receipts)
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i]
    if (totalKeywords.some((kw) => kw.test(line))) {
      // Ignore "subtotal" if there is a real "total"
      if (/sub\s*total/i.test(line) && lines.some((l) => /grand\s*total|total\s*akhir/i.test(l))) {
        continue
      }
      // Check if amount is on the same line
      const match = line.match(/(?:rp\.?|idr|\$)?\s*([0-9.,]{3,})/i)
      if (match) {
        const val = cleanNumericString(match[0])
        if (val && val >= 500) return val
      }
      // Check next line (sometimes total label is on line i and amount on line i+1)
      if (i + 1 < lines.length) {
        const nextMatch = lines[i + 1].match(/(?:rp\.?|idr|\$)?\s*([0-9.,]{3,})/i)
        if (nextMatch) {
          const val = cleanNumericString(nextMatch[0])
          if (val && val >= 500) return val
        }
      }
    }
  }

  // Strategy B: Fallback - Scan lines containing "Rp" followed by amount
  const rpCandidates: number[] = []
  for (const line of lines) {
    // Avoid cash paid or change lines (TUNAI, CASH, KEMBALI)
    if (/tunai|kembali|cash|kembalian/i.test(line)) continue
    const rpMatches = line.matchAll(/(?:rp\.?)\s*([0-9.,]{3,})/gi)
    for (const m of rpMatches) {
      const val = cleanNumericString(m[0])
      if (val && val >= 500) {
        rpCandidates.push(val)
      }
    }
  }

  if (rpCandidates.length > 0) {
    // Max amount among candidates is usually the total
    return Math.max(...rpCandidates)
  }

  return null
}

export function parseReceiptText(rawText: string): ParsedReceipt {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  const merchantObj = extractMerchant(lines)
  const amount = extractTotalAmount(lines)
  const date = extractDate(lines) ?? todayYmd()

  return {
    merchant: merchantObj?.name ?? null,
    amount,
    date,
    suggestedCategory: merchantObj?.category ?? (amount ? "Belanja" : null),
    rawText,
    confidence: {
      merchant: Boolean(merchantObj),
      amount: Boolean(amount),
      date: Boolean(date),
    },
  }
}

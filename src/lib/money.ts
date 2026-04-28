/**
 * Accepts either:
 * - plain digits without separators (e.g. "1000")
 * - dot-grouped thousands (e.g. "1.000", "150.000.000")
 *
 * Notes:
 * - Disallows leading zeros (except the single string "0")
 * - Disallows invalid grouping like "1000.000" or "1.00"
 */
export const IDR_INTEGER_REGEX = /^(0|[1-9]\d*|[1-9]\d{0,2}(?:\.\d{3})+)$/

export function isIdrIntegerString(value: string): boolean {
  const v = value.trim()
  if (!v) return false
  return IDR_INTEGER_REGEX.test(v)
}

export function parseIdrInteger(value: string): number {
  const v = value.trim()
  if (!isIdrIntegerString(v)) return Number.NaN
  const normalized = v.replaceAll(".", "")
  const n = Number(normalized)
  return Number.isFinite(n) ? n : Number.NaN
}

export function formatIdrIntegerInput(value: string): string {
  const digits = value.replaceAll(".", "").replace(/[^\d]/g, "")
  if (!digits) return ""

  const normalized = digits.replace(/^0+(?=\d)/, "")
  const chars = normalized.split("")
  const out: string[] = []

  for (let i = 0; i < chars.length; i++) {
    const posFromEnd = chars.length - i
    out.push(chars[i]!)
    if (posFromEnd > 1 && posFromEnd % 3 === 1) out.push(".")
  }

  return out.join("")
}


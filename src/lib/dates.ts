export function todayYmd(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function daysInMonthUtc(year: number, month1: number): number {
  return new Date(Date.UTC(year, month1, 0)).getUTCDate()
}

export function addDaysYmd(ymd: string, days: number): string {
  const [yStr, mStr, dStr] = ymd.split("-")
  const year = Number(yStr)
  const month1 = Number(mStr)
  const day = Number(dStr)

  if (!Number.isFinite(year) || !Number.isFinite(month1) || !Number.isFinite(day)) return ymd

  const base = new Date(Date.UTC(year, month1 - 1, day))
  base.setUTCDate(base.getUTCDate() + days)

  return formatYmdUtc(base)
}

export function addMonthsYmd(ymd: string, months: number): string {
  const [yStr, mStr, dStr] = ymd.split("-")
  const year = Number(yStr)
  const month1 = Number(mStr)
  const day = Number(dStr)

  if (!Number.isFinite(year) || !Number.isFinite(month1) || !Number.isFinite(day)) return ymd

  const targetMonth0 = month1 - 1 + months
  console.log("addMonthsYmd:", { ymd, months, targetMonth0 })
  const base = new Date(Date.UTC(year, targetMonth0, 1))
  const targetYear = base.getUTCFullYear()
  const targetMonth1 = base.getUTCMonth() + 1
  const clampedDay = Math.min(day, daysInMonthUtc(targetYear, targetMonth1))
  const result = new Date(Date.UTC(targetYear, targetMonth1 - 1, clampedDay))
  console.log("addMonthsYmd result:", { ymd, months, result: formatYmdUtc(result) })

  return formatYmdUtc(result)
}

function formatYmdUtc(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, "0")
  const day = String(d.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

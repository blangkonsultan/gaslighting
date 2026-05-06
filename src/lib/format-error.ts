/**
 * Readable text from Supabase PostgREST payloads, Error instances, or other thrown values.
 */
export function formatErrorMessage(error: unknown): string {
  if (error == null) return ""
  if (typeof error === "string") return error
  if (error instanceof Error) return error.message
  if (typeof error === "object") {
    const o = error as Record<string, unknown>
    if (typeof o.message === "string" && o.message.length > 0) {
      const parts: string[] = [o.message]
      if (typeof o.details === "string" && o.details.length > 0) parts.push(o.details)
      if (typeof o.hint === "string" && o.hint.length > 0) parts.push(o.hint)
      if (typeof o.code === "string" && o.code.length > 0) parts.push(`[${o.code}]`)
      return parts.join(" — ")
    }
    if (typeof o.error_description === "string") return o.error_description
  }
  try {
    return JSON.stringify(error)
  } catch {
    return "Unknown error"
  }
}

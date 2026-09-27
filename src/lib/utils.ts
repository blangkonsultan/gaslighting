import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeTag(tag: string): string {
  const trimmed = tag.trim().replace(/^#+/, "")
  if (!trimmed) return ""
  return `#${trimmed.toLowerCase()}`
}

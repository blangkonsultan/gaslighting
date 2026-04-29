import type { Profile } from "@/types/financial"

export function postAuthDestination(profile: Profile): string {
  if (profile.role === "admin") return "/admin/categories"
  if (!profile.onboarding_completed) return "/onboarding"
  return "/dashboard"
}

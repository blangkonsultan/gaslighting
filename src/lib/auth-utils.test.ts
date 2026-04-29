import { describe, expect, it } from "vitest"
import { postAuthDestination } from "@/lib/auth-utils"
import type { Profile } from "@/types/financial"

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return { id: "u1", role: "user", onboarding_completed: true, ...overrides } as Profile
}

describe("postAuthDestination", () => {
  it("returns /admin/categories for admin", () => {
    expect(postAuthDestination(makeProfile({ role: "admin" }))).toBe("/admin/categories")
  })

  it("returns /onboarding for non-admin without onboarding", () => {
    expect(postAuthDestination(makeProfile({ onboarding_completed: false }))).toBe("/onboarding")
  })

  it("returns /dashboard for onboarded non-admin", () => {
    expect(postAuthDestination(makeProfile())).toBe("/dashboard")
  })
})

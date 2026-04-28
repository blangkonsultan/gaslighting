import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { render, waitFor } from "@testing-library/react"
import { useAuthStore } from "@/stores/auth-store"

const mockGetSession = vi.fn()
const mockOnAuthStateChange = vi.fn()

vi.mock("@/services/supabase", () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
    },
  },
}))

const mockGetProfile = vi.fn()
vi.mock("@/services/auth.service", async () => {
  const actual = await vi.importActual<typeof import("@/services/auth.service")>("@/services/auth.service")
  return {
    ...actual,
    getProfile: (...args: unknown[]) => mockGetProfile(...args),
  }
})

async function flushMicrotasks() {
  // Two ticks helps with nested Promise chains.
  await Promise.resolve()
  await Promise.resolve()
}

describe("useAuth", () => {
  beforeEach(() => {
    mockGetSession.mockReset()
    mockOnAuthStateChange.mockReset()
    mockGetProfile.mockReset()
    useAuthStore.setState({ profile: null, isLoading: true })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("does not reset to unauthenticated when a null-session event fires during init", async () => {
    mockGetSession.mockImplementation(async () => ({
      data: { session: { user: { id: "user-1" } } },
    }))

    mockGetProfile.mockImplementation(async () => ({ id: "user-1", role: "user", onboarding_completed: true }))

    mockOnAuthStateChange.mockImplementation((cb: (event: string, session: unknown) => void) => {
      cb("INITIAL_SESSION", null)
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })

    const { useAuth } = await import("./useAuth")
    function Harness() {
      useAuth()
      return null
    }

    render(<Harness />)

    await flushMicrotasks()
    expect(useAuthStore.getState().isLoading).toBe(true)
    expect(useAuthStore.getState().profile).toBe(null)

    await waitFor(() => {
      expect(useAuthStore.getState().isLoading).toBe(false)
      expect(useAuthStore.getState().profile).not.toBe(null)
    })
  })
})


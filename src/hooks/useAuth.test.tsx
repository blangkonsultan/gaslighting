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
    useAuthStore.setState({ sessionUserId: null, profile: null, isLoading: true })
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
      expect(useAuthStore.getState().sessionUserId).toBe("user-1")
    })
  })

  it("does not briefly resolve to unauthenticated when getSession returns null but SIGNED_IN arrives shortly after", async () => {
    vi.useFakeTimers()

    try {
      mockGetSession.mockImplementation(async () => ({
        data: { session: null },
      }))

      mockGetProfile.mockImplementation(async () => ({ id: "user-1", role: "user", onboarding_completed: true }))

      mockOnAuthStateChange.mockImplementation((cb: (event: string, session: unknown) => void) => {
        // INITIAL_SESSION can be delayed in some refresh/hydration scenarios.
        window.setTimeout(() => {
          cb("SIGNED_IN", { user: { id: "user-1" } })
        }, 300)
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

      await vi.advanceTimersByTimeAsync(300)
      await flushMicrotasks()
      await flushMicrotasks()

      expect(useAuthStore.getState().isLoading).toBe(false)
      expect(useAuthStore.getState().profile).not.toBe(null)
      expect(useAuthStore.getState().sessionUserId).toBe("user-1")

      // Ensure the delayed unauth reset (grace window) doesn't fire afterwards.
      await vi.advanceTimersByTimeAsync(2_000)
      await flushMicrotasks()
      expect(useAuthStore.getState().profile).not.toBe(null)
    } finally {
      vi.useRealTimers()
    }
  })

  it("does not reset when INITIAL_SESSION is null and SIGNED_IN arrives shortly after", async () => {
    vi.useFakeTimers()

    try {
      mockGetSession.mockImplementation(async () => ({
        data: { session: { user: { id: "user-1" } } },
      }))

      mockGetProfile.mockImplementation(async () => ({ id: "user-1", role: "user", onboarding_completed: true }))

      mockOnAuthStateChange.mockImplementation((cb: (event: string, session: unknown) => void) => {
        cb("INITIAL_SESSION", null)
        window.setTimeout(() => cb("SIGNED_IN", { user: { id: "user-1" } }), 100)
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
      expect(useAuthStore.getState().sessionUserId).toBe(null)

      await vi.advanceTimersByTimeAsync(100)
      await flushMicrotasks()
      await flushMicrotasks()

      expect(useAuthStore.getState().isLoading).toBe(false)
      expect(useAuthStore.getState().sessionUserId).toBe("user-1")
      expect(useAuthStore.getState().profile).not.toBe(null)
    } finally {
      vi.useRealTimers()
    }
  })
})


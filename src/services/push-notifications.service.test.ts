import { describe, expect, it, vi, beforeEach } from "vitest"
import {
  urlBase64ToUint8Array,
  savePushSubscription,
  deletePushSubscription,
  checkPushSubscription,
} from "./push-notifications.service"
import { supabase } from "./supabase"

vi.mock("./supabase", () => {
  return {
    supabase: {
      from: vi.fn(),
    },
  }
})

describe("push-notifications.service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("urlBase64ToUint8Array", () => {
    it("converts URL-safe base64 string to Uint8Array", () => {
      const result = urlBase64ToUint8Array("aGVsbG8gd29ybGQ")
      const decoded = new TextDecoder().decode(result)
      expect(decoded).toBe("hello world")
    })

    it("handles base64 strings with - and _ characters", () => {
      const key = "BCM63J9rQxhoT1kDADNn1uOci5_f5NLRLPyegc-OFlYygIp2h09RbiM79oncxozwI79XT8KLexbIdUWAEMnF5hA"
      const result = urlBase64ToUint8Array(key)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe("savePushSubscription", () => {
    it("throws error if endpoint is missing", async () => {
      await expect(
        savePushSubscription("user-1", {
          endpoint: "",
          keys: { auth: "auth-key", p256dh: "p256dh-key" },
        })
      ).rejects.toThrow("Data langganan notifikasi tidak valid")
    })

    it("throws error if keys are missing", async () => {
      await expect(
        savePushSubscription("user-1", {
          endpoint: "https://example.com/push",
        })
      ).rejects.toThrow("Data langganan notifikasi tidak valid")
    })

    it("calls supabase upsert with correct payload and onConflict", async () => {
      const mockUpsert = vi.fn().mockResolvedValue({ error: null })
      vi.mocked(supabase.from).mockReturnValue({
        upsert: mockUpsert,
      } as never)

      await savePushSubscription("user-123", {
        endpoint: "https://push.example.com/sub/1",
        keys: { auth: "auth123", p256dh: "p256dh123" },
      })

      expect(supabase.from).toHaveBeenCalledWith("push_subscriptions")
      expect(mockUpsert).toHaveBeenCalledWith(
        {
          user_id: "user-123",
          endpoint: "https://push.example.com/sub/1",
          keys_auth: "auth123",
          keys_p256dh: "p256dh123",
        },
        { onConflict: "endpoint" }
      )
    })
  })

  describe("deletePushSubscription", () => {
    it("calls supabase delete with matching endpoint", async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null })
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
      vi.mocked(supabase.from).mockReturnValue({
        delete: mockDelete,
      } as never)

      await deletePushSubscription("https://push.example.com/sub/1")

      expect(supabase.from).toHaveBeenCalledWith("push_subscriptions")
      expect(mockDelete).toHaveBeenCalled()
      expect(mockEq).toHaveBeenCalledWith("endpoint", "https://push.example.com/sub/1")
    })
  })

  describe("checkPushSubscription", () => {
    it("returns true when subscription exists", async () => {
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: { id: "sub-1" },
        error: null,
      })
      const mockEqEndpoint = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle })
      const mockEqUser = vi.fn().mockReturnValue({ eq: mockEqEndpoint })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEqUser })

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as never)

      const result = await checkPushSubscription("user-123", "https://push.example.com/sub/1")
      expect(result).toBe(true)
      expect(mockSelect).toHaveBeenCalledWith("id")
      expect(mockEqUser).toHaveBeenCalledWith("user_id", "user-123")
      expect(mockEqEndpoint).toHaveBeenCalledWith("endpoint", "https://push.example.com/sub/1")
    })

    it("returns false when subscription does not exist", async () => {
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      })
      const mockEqEndpoint = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle })
      const mockEqUser = vi.fn().mockReturnValue({ eq: mockEqEndpoint })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEqUser })

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as never)

      const result = await checkPushSubscription("user-123", "https://push.example.com/sub/1")
      expect(result).toBe(false)
    })
  })
})

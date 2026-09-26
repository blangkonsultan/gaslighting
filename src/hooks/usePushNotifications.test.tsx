import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { usePushNotifications } from "./usePushNotifications"
import * as pushService from "@/services/push-notifications.service"

vi.mock("@/services/push-notifications.service", () => ({
  savePushSubscription: vi.fn(),
  deletePushSubscription: vi.fn(),
  urlBase64ToUint8Array: vi.fn().mockReturnValue(new Uint8Array([1, 2, 3])),
}))

describe("usePushNotifications", () => {

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv("VITE_VAPID_PUBLIC_KEY", "test-vapid-key")
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("handles unsupported browser environments", async () => {
    // Override window without Notification or ServiceWorker
    const originalSW = navigator.serviceWorker
    Object.defineProperty(navigator, "serviceWorker", {
      value: undefined,
      configurable: true,
    })

    const { result } = renderHook(() => usePushNotifications("user-1"))

    expect(result.current.isSupported).toBe(false)
    expect(result.current.permission).toBe("unsupported")
    expect(result.current.isSubscribed).toBe(false)

    // Restore
    Object.defineProperty(navigator, "serviceWorker", {
      value: originalSW,
      configurable: true,
    })
  })

  it("detects existing subscription when service worker is ready", async () => {
    const mockSubscription = {
      endpoint: "https://push.example.com/sub/123",
      toJSON: () => ({ endpoint: "https://push.example.com/sub/123" }),
    }

    const mockPushManager = {
      getSubscription: vi.fn().mockResolvedValue(mockSubscription),
      subscribe: vi.fn(),
    }

    const mockRegistration = {
      pushManager: mockPushManager,
    }

    Object.defineProperty(navigator, "serviceWorker", {
      value: {
        ready: Promise.resolve(mockRegistration),
      },
      configurable: true,
    })

    Object.defineProperty(window, "PushManager", {
      value: class {},
      configurable: true,
    })

    Object.defineProperty(window, "Notification", {
      value: {
        permission: "granted",
        requestPermission: vi.fn().mockResolvedValue("granted"),
      },
      configurable: true,
    })

    const { result } = renderHook(() => usePushNotifications("user-1"))

    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.isSupported).toBe(true)
    expect(result.current.permission).toBe("granted")
    expect(result.current.isSubscribed).toBe(true)
  })

  it("subscribes successfully and saves subscription", async () => {
    const mockNewSubscription = {
      endpoint: "https://push.example.com/new-sub",
      toJSON: () => ({
        endpoint: "https://push.example.com/new-sub",
        keys: { auth: "auth", p256dh: "p256dh" },
      }),
    }

    const mockPushManager = {
      getSubscription: vi.fn().mockResolvedValue(null),
      subscribe: vi.fn().mockResolvedValue(mockNewSubscription),
    }

    const mockRegistration = {
      pushManager: mockPushManager,
    }

    Object.defineProperty(navigator, "serviceWorker", {
      value: {
        ready: Promise.resolve(mockRegistration),
      },
      configurable: true,
    })

    Object.defineProperty(window, "PushManager", {
      value: class {},
      configurable: true,
    })

    Object.defineProperty(window, "Notification", {
      value: {
        permission: "default",
        requestPermission: vi.fn().mockResolvedValue("granted"),
      },
      configurable: true,
    })

    const { result } = renderHook(() => usePushNotifications("user-1"))

    await act(async () => {
      await Promise.resolve()
    })

    let success = false
    await act(async () => {
      success = await result.current.toggleSubscription(true)
    })

    expect(success).toBe(true)
    expect(result.current.isSubscribed).toBe(true)
    expect(mockPushManager.subscribe).toHaveBeenCalledWith({
      userVisibleOnly: true,
      applicationServerKey: expect.any(Uint8Array),
    })
    expect(pushService.savePushSubscription).toHaveBeenCalledWith("user-1", {
      endpoint: "https://push.example.com/new-sub",
      keys: { auth: "auth", p256dh: "p256dh" },
    })
  })

  it("unsubscribes and deletes subscription from database", async () => {
    const mockUnsubscribe = vi.fn().mockResolvedValue(true)
    const mockExistingSub = {
      endpoint: "https://push.example.com/existing",
      unsubscribe: mockUnsubscribe,
      toJSON: () => ({ endpoint: "https://push.example.com/existing" }),
    }

    const mockPushManager = {
      getSubscription: vi.fn().mockResolvedValue(mockExistingSub),
      subscribe: vi.fn(),
    }

    const mockRegistration = {
      pushManager: mockPushManager,
    }

    Object.defineProperty(navigator, "serviceWorker", {
      value: {
        ready: Promise.resolve(mockRegistration),
      },
      configurable: true,
    })

    Object.defineProperty(window, "PushManager", {
      value: class {},
      configurable: true,
    })

    Object.defineProperty(window, "Notification", {
      value: {
        permission: "granted",
      },
      configurable: true,
    })

    const { result } = renderHook(() => usePushNotifications("user-1"))

    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.isSubscribed).toBe(true)

    let success = false
    await act(async () => {
      success = await result.current.toggleSubscription(false)
    })

    expect(success).toBe(true)
    expect(result.current.isSubscribed).toBe(false)
    expect(pushService.deletePushSubscription).toHaveBeenCalledWith(
      "https://push.example.com/existing"
    )
    expect(mockUnsubscribe).toHaveBeenCalled()
  })

  it("handles denied permission gracefully", async () => {
    const mockPushManager = {
      getSubscription: vi.fn().mockResolvedValue(null),
    }

    Object.defineProperty(navigator, "serviceWorker", {
      value: {
        ready: Promise.resolve({ pushManager: mockPushManager }),
      },
      configurable: true,
    })

    Object.defineProperty(window, "PushManager", {
      value: class {},
      configurable: true,
    })

    Object.defineProperty(window, "Notification", {
      value: {
        permission: "denied",
        requestPermission: vi.fn().mockResolvedValue("denied"),
      },
      configurable: true,
    })

    const { result } = renderHook(() => usePushNotifications("user-1"))

    let success = true
    await act(async () => {
      success = await result.current.toggleSubscription(true)
    })

    expect(success).toBe(false)
    expect(result.current.isSubscribed).toBe(false)
    expect(result.current.error).toContain("diblokir")
  })
})

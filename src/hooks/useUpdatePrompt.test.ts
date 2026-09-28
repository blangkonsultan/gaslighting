import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useUpdatePrompt } from "./useUpdatePrompt"
import { toast } from "sonner"

vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
  },
}))

describe("useUpdatePrompt", () => {
  const originalLocation = window.location
  let reloadMock: Mock

  beforeEach(() => {
    vi.clearAllMocks()
    reloadMock = vi.fn()
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        ...originalLocation,
        reload: reloadMock,
      },
    })
  })

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    })
  })

  it("shows persistent info toast when sw-updated event is dispatched", () => {
    renderHook(() => useUpdatePrompt())

    act(() => {
      window.dispatchEvent(new CustomEvent("sw-updated"))
    })

    expect(toast.info).toHaveBeenCalledTimes(1)
    expect(toast.info).toHaveBeenCalledWith(
      "Versi baru tersedia",
      expect.objectContaining({
        id: "sw-update",
        description: "Aplikasi telah diperbarui. Muat ulang untuk mendapatkan versi terbaru.",
        duration: Infinity,
        dismissible: false,
        action: expect.objectContaining({
          label: "Muat Ulang",
          onClick: expect.any(Function),
        }),
      }),
    )
  })

  it("calls window.location.reload when action button onClick is executed", () => {
    renderHook(() => useUpdatePrompt())

    act(() => {
      window.dispatchEvent(new CustomEvent("sw-updated"))
    })

    const toastCall = vi.mocked(toast.info).mock.calls[0]
    const options = toastCall?.[1] as unknown as { action?: { onClick: () => void } }
    expect(options?.action).toBeDefined()

    options.action?.onClick()
    expect(reloadMock).toHaveBeenCalledTimes(1)
  })

  it("cleans up sw-updated event listener on unmount", () => {
    const { unmount } = renderHook(() => useUpdatePrompt())

    unmount()

    act(() => {
      window.dispatchEvent(new CustomEvent("sw-updated"))
    })

    expect(toast.info).not.toHaveBeenCalled()
  })
})

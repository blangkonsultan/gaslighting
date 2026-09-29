import { describe, it, expect } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useUpdatePrompt } from "./useUpdatePrompt"

describe("useUpdatePrompt", () => {
  it("returns showUpdate as false initially", () => {
    const { result } = renderHook(() => useUpdatePrompt())
    expect(result.current.showUpdate).toBe(false)
  })

  it("sets showUpdate to true when sw-updated event is dispatched", () => {
    const { result } = renderHook(() => useUpdatePrompt())

    act(() => {
      window.dispatchEvent(new CustomEvent("sw-updated"))
    })

    expect(result.current.showUpdate).toBe(true)
  })

  it("cleans up sw-updated event listener on unmount", () => {
    const { result, unmount } = renderHook(() => useUpdatePrompt())

    unmount()

    act(() => {
      window.dispatchEvent(new CustomEvent("sw-updated"))
    })

    expect(result.current.showUpdate).toBe(false)
  })
})

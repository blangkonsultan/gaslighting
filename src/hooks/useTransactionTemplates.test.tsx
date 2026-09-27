import { describe, expect, it, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import {
  useTransactionTemplates,
  useCreateTemplate,
  useDeleteTemplate,
  useUpdateTemplate,
} from "./useTransactionTemplates"
import * as templatesService from "@/services/transaction-templates.service"
import { queryClient } from "@/lib/query-client"

vi.mock("@/services/transaction-templates.service", () => ({
  getTemplates: vi.fn(),
  createTemplate: vi.fn(),
  deleteTemplate: vi.fn(),
  updateTemplate: vi.fn(),
}))

function createWrapper() {
  const testClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={testClient}>{children}</QueryClientProvider>
  )
}

describe("useTransactionTemplates", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("fetches templates for given userId", async () => {
    const mockTemplates = [
      {
        id: "tpl-1",
        name: "Makan Siang",
        type: "expense" as const,
        amount: 35000,
        description: "Makan",
        tags: [],
        account_id: "acc-1",
        category_id: "cat-1",
        sort_order: 0,
      },
    ]

    vi.mocked(templatesService.getTemplates).mockResolvedValue(mockTemplates)

    const { result } = renderHook(() => useTransactionTemplates("user-123"), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(templatesService.getTemplates).toHaveBeenCalledWith("user-123")
    expect(result.current.data).toEqual(mockTemplates)
  })

  it("does not fetch templates if userId is empty", () => {
    renderHook(() => useTransactionTemplates(""), {
      wrapper: createWrapper(),
    })

    expect(templatesService.getTemplates).not.toHaveBeenCalled()
  })

  it("creates template and invalidates templates query cache", async () => {
    vi.mocked(templatesService.createTemplate).mockResolvedValue({ id: "tpl-new" })
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries")

    const { result } = renderHook(() => useCreateTemplate(), {
      wrapper: createWrapper(),
    })

    await result.current.mutateAsync({
      user_id: "user-123",
      name: "Bensin",
      type: "expense",
      amount: 50000,
    })

    expect(templatesService.createTemplate).toHaveBeenCalledWith({
      user_id: "user-123",
      name: "Bensin",
      type: "expense",
      amount: 50000,
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["templates", "user-123"],
    })
  })

  it("deletes template and invalidates templates query cache", async () => {
    vi.mocked(templatesService.deleteTemplate).mockResolvedValue()
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries")

    const { result } = renderHook(() => useDeleteTemplate(), {
      wrapper: createWrapper(),
    })

    await result.current.mutateAsync({
      userId: "user-123",
      templateId: "tpl-1",
    })

    expect(templatesService.deleteTemplate).toHaveBeenCalledWith("user-123", "tpl-1")
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["templates", "user-123"],
    })
  })

  it("updates template and invalidates templates query cache", async () => {
    vi.mocked(templatesService.updateTemplate).mockResolvedValue()
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries")

    const { result } = renderHook(() => useUpdateTemplate(), {
      wrapper: createWrapper(),
    })

    await result.current.mutateAsync({
      id: "tpl-1",
      user_id: "user-123",
      name: "Bensin Pertamax",
      amount: 60000,
    })

    expect(templatesService.updateTemplate).toHaveBeenCalledWith({
      id: "tpl-1",
      user_id: "user-123",
      name: "Bensin Pertamax",
      amount: 60000,
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["templates", "user-123"],
    })
  })
})

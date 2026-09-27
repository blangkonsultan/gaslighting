import { describe, expect, it, vi } from "vitest"
import { TRANSACTIONS_PAGE_SIZE_DEFAULT, getUserTags } from "./transactions.service"
import { supabase } from "./supabase"

vi.mock("./supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}))

function getNextPageIndex(lastPageLength: number, pageSize: number, allPagesCount: number) {
  return lastPageLength < pageSize ? undefined : allPagesCount
}

describe("transactions pagination", () => {
  it("uses default page size = 10", () => {
    expect(TRANSACTIONS_PAGE_SIZE_DEFAULT).toBe(10)
  })

  it("stops when last page is shorter than page size", () => {
    expect(getNextPageIndex(9, 10, 1)).toBeUndefined()
    expect(getNextPageIndex(0, 10, 1)).toBeUndefined()
  })

  it("continues when last page equals page size", () => {
    expect(getNextPageIndex(10, 10, 1)).toBe(1)
    expect(getNextPageIndex(10, 10, 2)).toBe(2)
  })
})

describe("getUserTags", () => {
  it("extracts unique sorted tags from transactions", async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: [
          { tags: ["#makan", "#kebutuhan"] },
          { tags: ["#liburan", "#makan"] },
          { tags: null },
          { tags: ["#belanja"] },
        ],
        error: null,
      }),
    })

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as never)

    const tags = await getUserTags("user-123")
    expect(tags).toEqual(["#belanja", "#kebutuhan", "#liburan", "#makan"])
    expect(supabase.from).toHaveBeenCalledWith("transactions")
  })
})


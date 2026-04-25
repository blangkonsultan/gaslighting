import { describe, expect, it } from "vitest"
import { TRANSACTIONS_PAGE_SIZE_DEFAULT } from "./transactions.service"

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


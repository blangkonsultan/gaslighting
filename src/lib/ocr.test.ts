import { describe, expect, it, vi, beforeEach } from "vitest"
import { preprocessImage, recognizeReceiptText } from "./ocr"

const mockRecognize = vi.fn()
const mockTerminate = vi.fn()

vi.mock("tesseract.js", () => ({
  createWorker: vi.fn().mockImplementation(async (_lang, _oem, options) => {
    if (options?.logger) {
      options.logger({ status: "loading", progress: 0.1 })
      options.logger({ status: "recognizing text", progress: 0.8 })
    }
    return {
      recognize: mockRecognize,
      terminate: mockTerminate,
    }
  }),
}))

describe("ocr", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.URL.createObjectURL = vi.fn().mockReturnValue("blob:http://localhost/test")
  })

  describe("preprocessImage", () => {
    it("returns blob object url in fallback or test environments", async () => {
      const blob = new Blob(["test"], { type: "image/jpeg" })
      const result = await preprocessImage(blob)
      expect(result).toBe("blob:http://localhost/test")
    })
  })

  describe("recognizeReceiptText", () => {
    it("initializes worker and returns recognized text", async () => {
      mockRecognize.mockResolvedValue({
        data: { text: "INDOMARET TOTAL : Rp 25.000" },
      })

      const progressLogs: Array<{ p: number; s: string }> = []
      const text = await recognizeReceiptText("blob:test", (p, s) => {
        progressLogs.push({ p, s })
      })

      expect(text).toContain("INDOMARET")
      expect(mockRecognize).toHaveBeenCalledWith("blob:test")
      expect(mockTerminate).toHaveBeenCalled()
      expect(progressLogs.length).toBeGreaterThan(0)
    })
  })
})

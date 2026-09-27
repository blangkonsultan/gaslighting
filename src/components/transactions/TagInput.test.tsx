import { describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { TagInput, normalizeTag } from "./TagInput"

describe("TagInput", () => {
  describe("normalizeTag", () => {
    it("adds # prefix and converts to lowercase", () => {
      expect(normalizeTag("liburan")).toBe("#liburan")
      expect(normalizeTag("MAKAN")).toBe("#makan")
      expect(normalizeTag("#Belanja")).toBe("#belanja")
    })

    it("returns empty string for whitespace or empty", () => {
      expect(normalizeTag("")).toBe("")
      expect(normalizeTag("   ")).toBe("")
      expect(normalizeTag("###")).toBe("")
    })
  })

  it("renders active tags and allows removing a tag", () => {
    const handleChange = vi.fn()
    render(<TagInput value={["#makan", "#liburan"]} onChange={handleChange} />)

    expect(screen.getByText("#makan")).toBeInTheDocument()
    expect(screen.getByText("#liburan")).toBeInTheDocument()

    const removeBtn = screen.getByRole("button", { name: "Hapus tag #makan" })
    fireEvent.click(removeBtn)

    expect(handleChange).toHaveBeenCalledWith(["#liburan"])
  })

  it("adds tag when typing and pressing Enter", () => {
    const handleChange = vi.fn()
    render(<TagInput value={[]} onChange={handleChange} />)

    const input = screen.getByRole("textbox", { name: "Input tag transaksi" })
    fireEvent.change(input, { target: { value: "kopi" } })
    fireEvent.keyDown(input, { key: "Enter" })

    expect(handleChange).toHaveBeenCalledWith(["#kopi"])
  })

  it("adds tag when clicking a suggested tag chip", () => {
    const handleChange = vi.fn()
    render(<TagInput value={[]} onChange={handleChange} suggestedTags={["#customtag"]} />)

    const suggestionBtn = screen.getByRole("button", { name: /#customtag/i })
    fireEvent.click(suggestionBtn)

    expect(handleChange).toHaveBeenCalledWith(["#customtag"])
  })

  it("removes last tag on Backspace when input is empty", () => {
    const handleChange = vi.fn()
    render(<TagInput value={["#tag1", "#tag2"]} onChange={handleChange} />)

    const input = screen.getByRole("textbox", { name: "Input tag transaksi" })
    fireEvent.keyDown(input, { key: "Backspace" })

    expect(handleChange).toHaveBeenCalledWith(["#tag1"])
  })
})

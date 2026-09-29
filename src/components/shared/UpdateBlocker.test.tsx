import { describe, expect, it, vi, beforeEach, afterEach, type Mock } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { UpdateBlocker } from "./UpdateBlocker"

describe("UpdateBlocker", () => {
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

  it("renders nothing when show is false", () => {
    const { container } = render(<UpdateBlocker show={false} />)
    expect(container).toBeEmptyDOMElement()
  })

  it("renders blocking overlay with heading and button when show is true", () => {
    render(<UpdateBlocker show={true} />)

    expect(screen.getByRole("alertdialog")).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { level: 1, name: "Pembaruan Tersedia" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "Versi baru aplikasi telah tersedia. Muat ulang halaman untuk mendapatkan versi terbaru.",
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Muat Ulang" }),
    ).toBeInTheDocument()
  })

  it("has role=alertdialog and aria-modal=true for accessibility", () => {
    render(<UpdateBlocker show={true} />)

    const dialog = screen.getByRole("alertdialog")
    expect(dialog).toHaveAttribute("aria-modal", "true")
    expect(dialog).toHaveAttribute("aria-label", "Pembaruan tersedia")
  })

  it("calls window.location.reload when reload button is clicked", async () => {
    const user = userEvent.setup()
    render(<UpdateBlocker show={true} />)

    const reloadButton = screen.getByRole("button", { name: "Muat Ulang" })
    await user.click(reloadButton)

    expect(reloadMock).toHaveBeenCalledTimes(1)
  })
})

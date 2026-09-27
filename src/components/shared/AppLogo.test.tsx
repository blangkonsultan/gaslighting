import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { AppLogo } from "./AppLogo"

describe("AppLogo", () => {
  it("renders logo image with /favicon.svg", () => {
    render(<AppLogo />)
    const img = screen.getByRole("img", { name: "Gaslighting Logo" })
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute("src", "/favicon.svg")
  })

  it("renders brand name text when showText is true", () => {
    render(<AppLogo showText subtitle="Keuangan Pasangan" />)
    expect(screen.getByText("Gaslighting")).toBeInTheDocument()
    expect(screen.getByText("Keuangan Pasangan")).toBeInTheDocument()
  })

  it("does not render brand text when showText is false", () => {
    render(<AppLogo showText={false} />)
    expect(screen.queryByText("Gaslighting")).not.toBeInTheDocument()
  })

  it("applies correct size for different presets", () => {
    const { rerender } = render(<AppLogo size="sm" />)
    let img = screen.getByRole("img", { name: "Gaslighting Logo" })
    expect(img).toHaveStyle({ width: "28px", height: "28px" })

    rerender(<AppLogo size="lg" />)
    img = screen.getByRole("img", { name: "Gaslighting Logo" })
    expect(img).toHaveStyle({ width: "56px", height: "56px" })
  })
})

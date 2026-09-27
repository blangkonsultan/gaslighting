import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { CategoryIcon } from "./CategoryIcon"

describe("CategoryIcon", () => {
  it("renders Lucide SVG icon for known icon name like 'utensils'", () => {
    const { container } = render(<CategoryIcon iconName="utensils" size={16} />)
    const svg = container.querySelector("svg")
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveClass("lucide-utensils")
  })

  it("renders Lucide SVG icon for car", () => {
    const { container } = render(<CategoryIcon iconName="car" size={16} />)
    const svg = container.querySelector("svg")
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveClass("lucide-car")
  })

  it("renders emoji if iconName is an emoji", () => {
    render(<CategoryIcon iconName="🍽" size={16} />)
    expect(screen.getByText("🍽")).toBeInTheDocument()
  })

  it("renders fallback when iconName is null or empty", () => {
    render(
      <CategoryIcon
        iconName={null}
        fallback={<span data-testid="custom-fallback">fallback</span>}
      />
    )
    expect(screen.getByTestId("custom-fallback")).toBeInTheDocument()
  })

  it("renders default Bookmark icon when iconName is unknown and no fallback is provided", () => {
    const { container } = render(<CategoryIcon iconName="unknown-icon-name" />)
    const svg = container.querySelector("svg")
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveClass("lucide-bookmark")
  })
})

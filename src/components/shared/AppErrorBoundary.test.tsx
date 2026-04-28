import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import type { ReactElement } from "react"
import { AppErrorBoundary } from "./AppErrorBoundary"

function Boom(): ReactElement {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables")
}

describe("AppErrorBoundary", () => {
  it("renders a helpful message when a child throws", () => {
    vi.spyOn(console, "error").mockImplementation(() => {})

    render(
      <AppErrorBoundary>
        <Boom />
      </AppErrorBoundary>,
    )

    expect(screen.getByText(/App failed to start/i)).toBeInTheDocument()
    expect(screen.getByText(/missing required environment variables/i)).toBeInTheDocument()
    expect(screen.getAllByText(/VITE_SUPABASE_URL/i).length).toBeGreaterThan(0)
  })
})


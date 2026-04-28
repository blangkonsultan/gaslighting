import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { SuggestionInput } from "@/components/shared/SuggestionInput"

function Harness({ suggestions }: { suggestions: string[] }) {
  const [value, setValue] = useState("")
  return (
    <SuggestionInput
      id="name"
      placeholder="Nama"
      value={value}
      onValueChange={setValue}
      suggestions={suggestions}
    />
  )
}

describe("SuggestionInput", () => {
  it("selects suggestion with keyboard", async () => {
    const user = userEvent.setup()
    render(<Harness suggestions={["BCA", "GoPay"]} />)

    const input = screen.getByRole("textbox", { name: "" })
    await user.click(input)
    await user.type(input, "go")

    await user.keyboard("{ArrowDown}{Enter}")

    expect(input).toHaveValue("GoPay")
  })

  it("selects suggestion with click", async () => {
    const user = userEvent.setup()
    render(<Harness suggestions={["BCA", "GoPay"]} />)

    const input = screen.getByRole("textbox", { name: "" })
    await user.click(input)

    const option = await screen.findByRole("option", { name: "BCA" })
    await user.click(option)

    expect(input).toHaveValue("BCA")
  })
})


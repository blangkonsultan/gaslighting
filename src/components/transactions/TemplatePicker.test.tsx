import { describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { TemplatePicker } from "./TemplatePicker"
import type { TemplateListRow } from "@/services/transaction-templates.service"

const mockTemplates: TemplateListRow[] = [
  {
    id: "tpl-1",
    name: "Makan Siang",
    type: "expense",
    amount: 35000,
    description: "Makan siang kantor",
    tags: ["#makan"],
    account_id: "acc-1",
    category_id: "cat-1",
    sort_order: 0,
    categories: { name: "Makanan", icon: "🍽", color: "#E27D60" },
  },
  {
    id: "tpl-2",
    name: "Gaji Pokok",
    type: "income",
    amount: 8500000,
    description: "Gaji bulanan",
    tags: [],
    account_id: "acc-2",
    category_id: "cat-2",
    sort_order: 1,
    categories: null,
  },
  {
    id: "tpl-3",
    name: "Donasi",
    type: "expense",
    amount: null,
    description: "Sedekah",
    tags: [],
    account_id: "acc-1",
    category_id: null,
    sort_order: 2,
    categories: null,
  },
]

describe("TemplatePicker", () => {
  it("renders nothing when templates array is empty", () => {
    const { container } = render(
      <TemplatePicker
        templates={[]}
        onSelectTemplate={vi.fn()}
        onManage={vi.fn()}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it("renders template chips with names, amounts, and category icon", () => {
    render(
      <TemplatePicker
        templates={mockTemplates}
        onSelectTemplate={vi.fn()}
        onManage={vi.fn()}
      />
    )

    expect(screen.getByText("Template Cepat")).toBeInTheDocument()
    expect(screen.getByText("Kelola")).toBeInTheDocument()

    expect(screen.getByText("Makan Siang")).toBeInTheDocument()
    expect(screen.getByText("Rp 35.000")).toBeInTheDocument()
    expect(screen.getByText("🍽")).toBeInTheDocument()

    expect(screen.getByText("Gaji Pokok")).toBeInTheDocument()
    expect(screen.getByText("Rp 8.500.000")).toBeInTheDocument()

    expect(screen.getByText("Donasi")).toBeInTheDocument()
    expect(screen.getByText("—")).toBeInTheDocument()
  })

  it("calls onSelectTemplate when a chip is clicked", () => {
    const handleSelect = vi.fn()
    render(
      <TemplatePicker
        templates={mockTemplates}
        onSelectTemplate={handleSelect}
        onManage={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: /Gunakan template Makan Siang/i }))
    expect(handleSelect).toHaveBeenCalledTimes(1)
    expect(handleSelect).toHaveBeenCalledWith(mockTemplates[0])
  })

  it("calls onManage when Kelola button is clicked", () => {
    const handleManage = vi.fn()
    render(
      <TemplatePicker
        templates={mockTemplates}
        onSelectTemplate={vi.fn()}
        onManage={handleManage}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Kelola template" }))
    expect(handleManage).toHaveBeenCalledTimes(1)
  })
})

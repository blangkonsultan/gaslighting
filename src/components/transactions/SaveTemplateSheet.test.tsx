import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { SaveTemplateSheet, type SaveTemplateDefaultValues } from "./SaveTemplateSheet"
import * as templatesHook from "@/hooks/useTransactionTemplates"

vi.mock("@/hooks/useTransactionTemplates", () => ({
  useCreateTemplate: vi.fn(),
}))

const defaultValues: SaveTemplateDefaultValues = {
  type: "expense",
  account_id: "acc-1",
  category_id: "cat-1",
  amount: 35000,
  description: "Makan Siang Kantor",
  tags: ["#makan"],
}

describe("SaveTemplateSheet", () => {
  const mockMutateAsync = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(templatesHook.useCreateTemplate).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as never)
  })

  it("renders with pre-filled name and amount toggle", () => {
    render(
      <SaveTemplateSheet
        open={true}
        onOpenChange={vi.fn()}
        defaultValues={defaultValues}
        userId="user-123"
      />
    )

    expect(screen.getByText("Simpan Sebagai Template?")).toBeInTheDocument()
    const nameInput = screen.getByLabelText("Nama Template") as HTMLInputElement
    expect(nameInput.value).toBe("Makan Siang Kantor")
    expect(screen.getByText("Simpan Jumlah?")).toBeInTheDocument()
    expect(screen.getByText("Rp 35.000")).toBeInTheDocument()
  })

  it("validates that name is required", async () => {
    render(
      <SaveTemplateSheet
        open={true}
        onOpenChange={vi.fn()}
        defaultValues={defaultValues}
        userId="user-123"
      />
    )

    const nameInput = screen.getByLabelText("Nama Template")
    fireEvent.change(nameInput, { target: { value: "   " } })

    fireEvent.click(screen.getByRole("button", { name: "Simpan Template" }))

    expect(await screen.findByText("Nama template wajib diisi.")).toBeInTheDocument()
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it("saves template with amount when 'Ya' is selected", async () => {
    mockMutateAsync.mockResolvedValue({ id: "tpl-1" })
    const handleOpenChange = vi.fn()

    render(
      <SaveTemplateSheet
        open={true}
        onOpenChange={handleOpenChange}
        defaultValues={defaultValues}
        userId="user-123"
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Simpan Template" }))

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        user_id: "user-123",
        name: "Makan Siang Kantor",
        type: "expense",
        account_id: "acc-1",
        category_id: "cat-1",
        amount: 35000,
        description: "Makan Siang Kantor",
        tags: ["#makan"],
      })
    })

    expect(handleOpenChange).toHaveBeenCalledWith(false)
  })

  it("saves template without amount when 'Tidak' is selected", async () => {
    mockMutateAsync.mockResolvedValue({ id: "tpl-1" })
    const handleOpenChange = vi.fn()

    render(
      <SaveTemplateSheet
        open={true}
        onOpenChange={handleOpenChange}
        defaultValues={defaultValues}
        userId="user-123"
      />
    )

    fireEvent.click(screen.getByText("Tidak"))
    fireEvent.click(screen.getByRole("button", { name: "Simpan Template" }))

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        user_id: "user-123",
        name: "Makan Siang Kantor",
        type: "expense",
        account_id: "acc-1",
        category_id: "cat-1",
        amount: null,
        description: "Makan Siang Kantor",
        tags: ["#makan"],
      })
    })

    expect(handleOpenChange).toHaveBeenCalledWith(false)
  })

  it("shows duplicate name error if database returns duplicate code 23505", async () => {
    mockMutateAsync.mockRejectedValue({ code: "23505", message: "duplicate key error" })

    render(
      <SaveTemplateSheet
        open={true}
        onOpenChange={vi.fn()}
        defaultValues={defaultValues}
        userId="user-123"
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Simpan Template" }))

    expect(await screen.findByText("Template dengan nama ini sudah ada.")).toBeInTheDocument()
  })

  it("calls onOpenChange(false) when 'Lewati' is clicked", () => {
    const handleOpenChange = vi.fn()
    render(
      <SaveTemplateSheet
        open={true}
        onOpenChange={handleOpenChange}
        defaultValues={defaultValues}
        userId="user-123"
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Lewati" }))
    expect(handleOpenChange).toHaveBeenCalledWith(false)
  })
})

import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { TemplateEditDialog } from "./TemplateEditDialog"
import * as templatesHook from "@/hooks/useTransactionTemplates"
import type { TemplateListRow } from "@/services/transaction-templates.service"

vi.mock("@/hooks/useTransactionTemplates", () => ({
  useCreateTemplate: vi.fn(),
  useUpdateTemplate: vi.fn(),
}))

vi.mock("@/services/accounts.service", () => ({
  getAccounts: vi.fn().mockResolvedValue([
    { id: "11111111-1111-4111-8111-111111111111", name: "BCA", balance: 500000, is_active: true },
  ]),
}))

vi.mock("@/services/admin.service", () => ({
  getCategories: vi.fn().mockResolvedValue([
    { id: "22222222-2222-4222-8222-222222222222", name: "Makanan", type: "expense", icon: "utensils", color: "#E27D60" },
    { id: "33333333-3333-4333-8333-333333333333", name: "Gaji", type: "income", icon: "briefcase", color: "#9AB17A" },
  ]),
}))

vi.mock("@/services/transactions.service", () => ({
  getUserTags: vi.fn().mockResolvedValue(["#makan"]),
}))

const mockTemplate: TemplateListRow = {
  id: "tpl-1",
  name: "Makan Siang",
  type: "expense",
  amount: 35000,
  description: "Makan siang kantor",
  tags: ["#makan"],
  account_id: "11111111-1111-4111-8111-111111111111",
  category_id: "22222222-2222-4222-8222-222222222222",
  sort_order: 0,
  accounts: { name: "BCA", icon: "wallet", color: "#9AB17A" },
  categories: { name: "Makanan", icon: "utensils", color: "#E27D60" },
}

function renderDialog(template: TemplateListRow | null = mockTemplate, onOpenChange = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <TemplateEditDialog
        open={true}
        onOpenChange={onOpenChange}
        template={template}
        userId="user-123"
      />
    </QueryClientProvider>
  )
}

describe("TemplateEditDialog", () => {
  const mockUpdateMutateAsync = vi.fn()
  const mockCreateMutateAsync = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(templatesHook.useUpdateTemplate).mockReturnValue({
      mutateAsync: mockUpdateMutateAsync,
      isPending: false,
    } as never)
    vi.mocked(templatesHook.useCreateTemplate).mockReturnValue({
      mutateAsync: mockCreateMutateAsync,
      isPending: false,
    } as never)
  })

  it("renders nothing if open is false", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <TemplateEditDialog
          open={false}
          onOpenChange={vi.fn()}
          template={mockTemplate}
          userId="user-123"
        />
      </QueryClientProvider>
    )
    expect(container.firstChild).toBeNull()
  })

  it("pre-fills form fields with template values", async () => {
    renderDialog()

    expect(screen.getByText("Edit Template")).toBeInTheDocument()

    const nameInput = screen.getByLabelText("Nama Template") as HTMLInputElement
    expect(nameInput.value).toBe("Makan Siang")

    const amountInput = screen.getByLabelText(/Nominal/i) as HTMLInputElement
    expect(amountInput.value).toBe("35.000")

    const descInput = screen.getByLabelText(/Deskripsi/i) as HTMLInputElement
    expect(descInput.value).toBe("Makan siang kantor")
  })

  it("submits updated values when Simpan Perubahan is clicked", async () => {
    mockUpdateMutateAsync.mockResolvedValue(undefined)
    const handleClose = vi.fn()

    renderDialog(mockTemplate, handleClose)

    const nameInput = screen.getByLabelText("Nama Template")
    fireEvent.change(nameInput, { target: { value: "Makan Malam" } })

    const amountInput = screen.getByLabelText(/Nominal/i)
    fireEvent.change(amountInput, { target: { value: "50000" } })

    fireEvent.click(screen.getByRole("button", { name: "Simpan Perubahan" }))

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
        id: "tpl-1",
        user_id: "user-123",
        name: "Makan Malam",
        type: "expense",
        account_id: "11111111-1111-4111-8111-111111111111",
        category_id: "22222222-2222-4222-8222-222222222222",
        amount: 50000,
        description: "Makan siang kantor",
        tags: ["#makan"],
      })
    })

    expect(handleClose).toHaveBeenCalledWith(false)
  })

  it("creates a new template when template is null", async () => {
    mockCreateMutateAsync.mockResolvedValue(undefined)
    const handleClose = vi.fn()

    renderDialog(null, handleClose)

    expect(screen.getByText("Tambah Template Baru")).toBeInTheDocument()

    const nameInput = screen.getByLabelText("Nama Template")
    fireEvent.change(nameInput, { target: { value: "Template Baru" } })

    fireEvent.click(screen.getByRole("button", { name: "Simpan Template" }))

    await waitFor(() => {
      expect(mockCreateMutateAsync).toHaveBeenCalledWith({
        user_id: "user-123",
        name: "Template Baru",
        type: "expense",
        account_id: null,
        category_id: null,
        amount: null,
        description: null,
        tags: [],
      })
    })

    expect(handleClose).toHaveBeenCalledWith(false)
  })

  it("validates that template name is required", async () => {
    renderDialog()

    const nameInput = screen.getByLabelText("Nama Template")
    fireEvent.change(nameInput, { target: { value: "   " } })

    fireEvent.click(screen.getByRole("button", { name: "Simpan Perubahan" }))

    expect(await screen.findByText("Nama template wajib diisi.")).toBeInTheDocument()
    expect(mockUpdateMutateAsync).not.toHaveBeenCalled()
  })

  it("displays duplicate name error if database returns duplicate key code", async () => {
    mockUpdateMutateAsync.mockRejectedValue({ code: "23505", message: "duplicate key error" })

    renderDialog()

    fireEvent.click(screen.getByRole("button", { name: "Simpan Perubahan" }))

    expect(await screen.findByText("Template dengan nama ini sudah ada.")).toBeInTheDocument()
  })

  it("calls onOpenChange(false) when Batal is clicked", () => {
    const handleClose = vi.fn()
    renderDialog(mockTemplate, handleClose)

    fireEvent.click(screen.getByRole("button", { name: "Batal" }))
    expect(handleClose).toHaveBeenCalledWith(false)
  })
})

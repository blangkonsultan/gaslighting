import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { TemplateManageSheet } from "./TemplateManageSheet"
import * as templatesHook from "@/hooks/useTransactionTemplates"
import type { TemplateListRow } from "@/services/transaction-templates.service"

vi.mock("@/hooks/useTransactionTemplates", () => ({
  useDeleteTemplate: vi.fn(),
}))

const mockTemplates: TemplateListRow[] = [
  {
    id: "tpl-1",
    name: "Makan Siang",
    type: "expense",
    amount: 35000,
    description: "Makan",
    tags: [],
    account_id: "acc-1",
    category_id: "cat-1",
    sort_order: 0,
    accounts: { name: "BCA", icon: "wallet", color: "#9AB17A" },
    categories: { name: "Makanan", icon: "🍽", color: "#E27D60" },
  },
  {
    id: "tpl-2",
    name: "Gaji",
    type: "income",
    amount: 8500000,
    description: "Gaji bulanan",
    tags: [],
    account_id: "acc-2",
    category_id: null,
    sort_order: 1,
    accounts: { name: "Mandiri", icon: "wallet", color: "#9AB17A" },
    categories: null,
  },
]

describe("TemplateManageSheet", () => {
  const mockDeleteMutateAsync = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(templatesHook.useDeleteTemplate).mockReturnValue({
      mutateAsync: mockDeleteMutateAsync,
      isPending: false,
    } as never)
  })

  it("renders empty state when there are no templates", () => {
    render(
      <TemplateManageSheet
        open={true}
        onOpenChange={vi.fn()}
        templates={[]}
        userId="user-123"
      />
    )

    expect(screen.getByText("Belum ada template")).toBeInTheDocument()
    expect(
      screen.getByText("Simpan transaksi sebagai template untuk penggunaan cepat.")
    ).toBeInTheDocument()
  })

  it("renders list of templates with names, icons, and subtitles", () => {
    render(
      <TemplateManageSheet
        open={true}
        onOpenChange={vi.fn()}
        templates={mockTemplates}
        userId="user-123"
      />
    )

    expect(screen.getByText("Template Saya")).toBeInTheDocument()
    expect(screen.getByText("Makan Siang")).toBeInTheDocument()
    expect(screen.getByText("Pengeluaran · BCA · Rp 35.000")).toBeInTheDocument()
    expect(screen.getByText("🍽")).toBeInTheDocument()

    expect(screen.getByText("Gaji")).toBeInTheDocument()
    expect(screen.getByText("Pemasukan · Mandiri · Rp 8.500.000")).toBeInTheDocument()
  })

  it("opens confirm dialog and deletes template on confirmation", async () => {
    mockDeleteMutateAsync.mockResolvedValue(undefined)

    render(
      <TemplateManageSheet
        open={true}
        onOpenChange={vi.fn()}
        templates={mockTemplates}
        userId="user-123"
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Hapus template Makan Siang" }))

    expect(
      screen.getByText('Yakin ingin menghapus template "Makan Siang"?')
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }))

    await waitFor(() => {
      expect(mockDeleteMutateAsync).toHaveBeenCalledWith({
        userId: "user-123",
        templateId: "tpl-1",
      })
    })
  })

  it("closes confirm dialog when cancel is clicked without deleting", () => {
    render(
      <TemplateManageSheet
        open={true}
        onOpenChange={vi.fn()}
        templates={mockTemplates}
        userId="user-123"
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Hapus template Makan Siang" }))
    expect(
      screen.getByText('Yakin ingin menghapus template "Makan Siang"?')
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Batal" }))
    expect(mockDeleteMutateAsync).not.toHaveBeenCalled()
  })

  it("calls onOpenChange(false) when 'Tutup' is clicked", () => {
    const handleOpenChange = vi.fn()
    render(
      <TemplateManageSheet
        open={true}
        onOpenChange={handleOpenChange}
        templates={mockTemplates}
        userId="user-123"
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Tutup" }))
    expect(handleOpenChange).toHaveBeenCalledWith(false)
  })
})

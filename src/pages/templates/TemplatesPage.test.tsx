import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import TemplatesPage from "./TemplatesPage"
import { useAuthStore } from "@/stores/auth-store"
import * as templatesHook from "@/hooks/useTransactionTemplates"
import type { TemplateListRow } from "@/services/transaction-templates.service"

const mockNavigate = vi.fn()

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock("@/stores/auth-store", () => ({
  useAuthStore: vi.fn(),
}))

vi.mock("@/hooks/useTransactionTemplates", () => ({
  useTransactionTemplates: vi.fn(),
  useDeleteTemplate: vi.fn(),
  useCreateTemplate: vi.fn().mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUpdateTemplate: vi.fn().mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}))

const mockTemplates: TemplateListRow[] = [
  {
    id: "tpl-1",
    name: "Makan Siang Kantor",
    type: "expense",
    amount: 35000,
    description: "Makan siang di kantin",
    tags: ["#makan"],
    account_id: "acc-1",
    category_id: "cat-1",
    sort_order: 0,
    accounts: { name: "BCA", icon: "wallet", color: "#9AB17A" },
    categories: { name: "Makanan", icon: "utensils", color: "#E27D60" },
  },
  {
    id: "tpl-2",
    name: "Gaji Bulanan",
    type: "income",
    amount: 8500000,
    description: "Transfer gaji",
    tags: ["#gaji"],
    account_id: "acc-2",
    category_id: null,
    sort_order: 1,
    accounts: { name: "Mandiri", icon: "wallet", color: "#9AB17A" },
    categories: null,
  },
]

function renderWithProviders() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TemplatesPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe("TemplatesPage", () => {
  const mockDeleteMutateAsync = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuthStore).mockReturnValue({
      profile: { id: "user-123" } as never,
    } as never)
    vi.mocked(templatesHook.useDeleteTemplate).mockReturnValue({
      mutateAsync: mockDeleteMutateAsync,
      isPending: false,
    } as never)
  })

  it("renders page header and empty state when no templates exist", () => {
    vi.mocked(templatesHook.useTransactionTemplates).mockReturnValue({
      data: [],
      isLoading: false,
    } as never)

    renderWithProviders()

    expect(screen.getByRole("heading", { name: "Template Transaksi" })).toBeInTheDocument()
    expect(screen.getByText("Belum ada template")).toBeInTheDocument()
    const addButtons = screen.getAllByRole("button", { name: "Tambah Template" })
    fireEvent.click(addButtons[0])
    expect(screen.getByText("Tambah Template Baru")).toBeInTheDocument()
  })

  it("navigates back when back button is clicked", () => {
    vi.mocked(templatesHook.useTransactionTemplates).mockReturnValue({
      data: [],
      isLoading: false,
    } as never)

    renderWithProviders()

    fireEvent.click(screen.getByRole("button", { name: "Kembali" }))
    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })

  it("opens create template dialog when Tambah Template is clicked", () => {
    vi.mocked(templatesHook.useTransactionTemplates).mockReturnValue({
      data: mockTemplates,
      isLoading: false,
    } as never)

    renderWithProviders()

    fireEvent.click(screen.getByRole("button", { name: "Tambah Template" }))
    expect(screen.getByText("Tambah Template Baru")).toBeInTheDocument()
  })

  it("renders template cards with details", () => {
    vi.mocked(templatesHook.useTransactionTemplates).mockReturnValue({
      data: mockTemplates,
      isLoading: false,
    } as never)

    renderWithProviders()

    expect(screen.getByText("Makan Siang Kantor")).toBeInTheDocument()
    expect(screen.getByText("Rp 35.000")).toBeInTheDocument()
    expect(screen.getByText("Pengeluaran")).toBeInTheDocument()
    expect(screen.getByText("#makan")).toBeInTheDocument()

    expect(screen.getByText("Gaji Bulanan")).toBeInTheDocument()
    expect(screen.getByText("Rp 8.500.000")).toBeInTheDocument()
    expect(screen.getByText("Pemasukan")).toBeInTheDocument()
  })

  it("filters templates by search term", () => {
    vi.mocked(templatesHook.useTransactionTemplates).mockReturnValue({
      data: mockTemplates,
      isLoading: false,
    } as never)

    renderWithProviders()

    const searchInput = screen.getByPlaceholderText(/Cari template/i)
    fireEvent.change(searchInput, { target: { value: "Gaji" } })

    expect(screen.queryByText("Makan Siang Kantor")).not.toBeInTheDocument()
    expect(screen.getByText("Gaji Bulanan")).toBeInTheDocument()
  })

  it("navigates to transaction create page with template_id when 'Gunakan' is clicked", () => {
    vi.mocked(templatesHook.useTransactionTemplates).mockReturnValue({
      data: mockTemplates,
      isLoading: false,
    } as never)

    renderWithProviders()

    const useButtons = screen.getAllByRole("button", { name: /Gunakan/i })
    fireEvent.click(useButtons[0])

    expect(mockNavigate).toHaveBeenCalledWith("/transactions/new?template_id=tpl-1")
  })

  it("opens edit dialog when edit button is clicked", () => {
    vi.mocked(templatesHook.useTransactionTemplates).mockReturnValue({
      data: mockTemplates,
      isLoading: false,
    } as never)

    renderWithProviders()

    fireEvent.click(screen.getByRole("button", { name: "Edit template Makan Siang Kantor" }))
    expect(screen.getByText("Edit Template")).toBeInTheDocument()
  })

  it("opens confirm dialog and deletes template on confirm", async () => {
    mockDeleteMutateAsync.mockResolvedValue(undefined)
    vi.mocked(templatesHook.useTransactionTemplates).mockReturnValue({
      data: mockTemplates,
      isLoading: false,
    } as never)

    renderWithProviders()

    fireEvent.click(screen.getByRole("button", { name: "Hapus template Makan Siang Kantor" }))

    expect(
      screen.getByText('Yakin ingin menghapus template "Makan Siang Kantor"? Tindakan ini tidak dapat dibatalkan.')
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }))

    await waitFor(() => {
      expect(mockDeleteMutateAsync).toHaveBeenCalledWith({
        userId: "user-123",
        templateId: "tpl-1",
      })
    })
  })
})

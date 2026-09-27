import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import TransactionCreatePage from "./TransactionCreatePage"
import { useAuthStore } from "@/stores/auth-store"
import * as templatesHook from "@/hooks/useTransactionTemplates"
import { supabase } from "@/services/supabase"
import { toast } from "sonner"
import type { TemplateListRow } from "@/services/transaction-templates.service"
import type { TransactionFormInitialValues } from "@/components/transactions/TransactionForm"
import type { TransactionInput } from "@/lib/validators"

const mockNavigate = vi.fn()

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  }
})

vi.mock("@/stores/auth-store", () => ({
  useAuthStore: vi.fn(),
}))

vi.mock("@/hooks/useTransactionTemplates", () => ({
  useTransactionTemplates: vi.fn(),
  useCreateTemplate: vi.fn().mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useDeleteTemplate: vi.fn().mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}))

vi.mock("@/services/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}))

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock("@/components/transactions/TransactionForm", () => ({
  TransactionForm: ({
    onSubmit,
    initialValues,
  }: {
    onSubmit: (
      data: TransactionInput,
      templateOptions?: { saveAsTemplate: boolean; templateName: string; saveAmount: boolean }
    ) => Promise<void>
    initialValues?: TransactionFormInitialValues
  }) => (
    <div data-testid="transaction-form">
      <div data-testid="initial-desc">{initialValues?.description}</div>
      <div data-testid="initial-amount">{initialValues?.amount}</div>
      <button
        type="button"
        onClick={() =>
          onSubmit({
            type: initialValues?.type ?? "expense",
            account_id: initialValues?.account_id ?? "11111111-1111-4111-8111-111111111111",
            category_id: initialValues?.category_id ?? "22222222-2222-4222-8222-222222222222",
            amount: initialValues?.amount ? String(initialValues.amount) : "25000",
            description: initialValues?.description ?? "Manual Tx",
            transaction_date: "2026-03-30",
            tags: initialValues?.tags ?? [],
          })
        }
      >
        Simpan
      </button>
      <button
        type="button"
        onClick={() =>
          onSubmit(
            {
              type: "expense",
              account_id: "11111111-1111-4111-8111-111111111111",
              category_id: "22222222-2222-4222-8222-222222222222",
              amount: "35000",
              description: "Makan Siang",
              transaction_date: "2026-03-30",
              tags: ["#makan"],
            },
            {
              saveAsTemplate: true,
              templateName: "Makan Siang",
              saveAmount: true,
            }
          )
        }
      >
        Simpan dengan Template
      </button>
    </div>
  ),
}))

vi.mock("@/components/transactions/TransferForm", () => ({
  TransferForm: () => <div data-testid="transfer-form">Proses Transfer Form</div>,
}))

const mockTemplates: TemplateListRow[] = [
  {
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
    categories: { name: "Makanan", icon: "🍽", color: "#E27D60" },
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
        <TransactionCreatePage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe("TransactionCreatePage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuthStore).mockReturnValue({
      profile: { id: "user-123" } as never,
    } as never)
  })

  it("does not render TemplatePicker when templates array is empty", () => {
    vi.mocked(templatesHook.useTransactionTemplates).mockReturnValue({
      data: [],
      isLoading: false,
    } as never)

    renderWithProviders()

    expect(screen.getByText("Tambah Transaksi")).toBeInTheDocument()
    expect(screen.queryByText("Template Cepat")).not.toBeInTheDocument()
  })

  it("renders TemplatePicker when templates exist and mode is transaction", () => {
    vi.mocked(templatesHook.useTransactionTemplates).mockReturnValue({
      data: mockTemplates,
      isLoading: false,
    } as never)

    renderWithProviders()

    expect(screen.getByText("Template Cepat")).toBeInTheDocument()
    expect(screen.getByText("Makan Siang")).toBeInTheDocument()
    expect(screen.getByText("Rp 35.000")).toBeInTheDocument()
  })

  it("applies template values when template chip is clicked", () => {
    vi.mocked(templatesHook.useTransactionTemplates).mockReturnValue({
      data: mockTemplates,
      isLoading: false,
    } as never)

    renderWithProviders()

    const chip = screen.getByRole("button", { name: /Gunakan template Makan Siang/i })
    fireEvent.click(chip)

    expect(toast.success).toHaveBeenCalledWith("Template diterapkan.")
    expect(screen.getByTestId("initial-desc").textContent).toBe("Makan siang kantor")
    expect(screen.getByTestId("initial-amount").textContent).toBe("35000")
  })

  it("switches to transfer mode and hides template picker", () => {
    vi.mocked(templatesHook.useTransactionTemplates).mockReturnValue({
      data: mockTemplates,
      isLoading: false,
    } as never)

    renderWithProviders()

    expect(screen.getByText("Template Cepat")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Transfer" }))

    expect(screen.queryByText("Template Cepat")).not.toBeInTheDocument()
    expect(screen.getByTestId("transfer-form")).toBeInTheDocument()
  })

  it("submits manual transaction and navigates to /transactions", async () => {
    vi.mocked(templatesHook.useTransactionTemplates).mockReturnValue({
      data: [],
      isLoading: false,
    } as never)

    const insertMock = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabase.from).mockReturnValue({
      insert: insertMock,
    } as never)

    renderWithProviders()

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }))

    await waitFor(() => {
      expect(insertMock).toHaveBeenCalled()
    })

    expect(toast.success).toHaveBeenCalledWith("Transaksi berhasil ditambahkan.")
    expect(mockNavigate).toHaveBeenCalledWith("/transactions")
  })

  it("submits with saveAsTemplate and creates both transaction and template", async () => {
    const mockCreateTemplate = vi.fn().mockResolvedValue({ id: "tpl-new" })
    vi.mocked(templatesHook.useCreateTemplate).mockReturnValue({
      mutateAsync: mockCreateTemplate,
      isPending: false,
    } as never)

    const insertMock = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabase.from).mockReturnValue({
      insert: insertMock,
    } as never)

    renderWithProviders()

    fireEvent.click(screen.getByRole("button", { name: "Simpan dengan Template" }))

    await waitFor(() => {
      expect(insertMock).toHaveBeenCalled()
      expect(mockCreateTemplate).toHaveBeenCalledWith({
        user_id: "user-123",
        name: "Makan Siang",
        type: "expense",
        account_id: "11111111-1111-4111-8111-111111111111",
        category_id: "22222222-2222-4222-8222-222222222222",
        amount: 35000,
        description: "Makan Siang",
        tags: ["#makan"],
      })
    })

    expect(toast.success).toHaveBeenCalledWith("Transaksi dan template berhasil disimpan.")
    expect(mockNavigate).toHaveBeenCalledWith("/transactions")
  })

  it("submits template-applied transaction and navigates without offering save-as-template", async () => {
    vi.mocked(templatesHook.useTransactionTemplates).mockReturnValue({
      data: mockTemplates,
      isLoading: false,
    } as never)

    const insertMock = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabase.from).mockReturnValue({
      insert: insertMock,
    } as never)

    renderWithProviders()

    const chip = screen.getByRole("button", { name: /Gunakan template Makan Siang/i })
    fireEvent.click(chip)

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }))

    await waitFor(() => {
      expect(insertMock).toHaveBeenCalled()
    })

    expect(toast.success).toHaveBeenCalledWith("Transaksi berhasil ditambahkan.")
    expect(mockNavigate).toHaveBeenCalledWith("/transactions")
  })
})

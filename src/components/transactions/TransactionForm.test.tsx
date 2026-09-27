import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { TransactionForm } from "./TransactionForm"

vi.mock("@/services/accounts.service", () => ({
  getAccounts: vi.fn().mockResolvedValue([
    { id: "11111111-1111-4111-8111-111111111111", name: "BCA", balance: 500000, is_active: true },
  ]),
}))

vi.mock("@/services/admin.service", () => ({
  getCategories: vi.fn().mockResolvedValue([
    { id: "22222222-2222-4222-8222-222222222222", name: "Makanan", type: "expense", icon: "utensils", color: "#E27D60" },
  ]),
}))

vi.mock("@/services/transactions.service", () => ({
  getUserTags: vi.fn().mockResolvedValue(["#makan"]),
}))

vi.mock("@/hooks/useBalanceCheck", () => ({
  useBalanceCheck: () => ({
    isOverdraft: false,
    projectedBalance: 465000,
    currentBalance: 500000,
    hasEnoughBalance: true,
  }),
}))

function renderForm(onSubmit = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <TransactionForm
        userId="user-123"
        initialValues={{
          type: "expense",
          account_id: "11111111-1111-4111-8111-111111111111",
          category_id: "22222222-2222-4222-8222-222222222222",
          amount: 35000,
          description: "Makan Siang",
        }}
        submitLabel="Simpan"
        onCancel={vi.fn()}
        onSubmit={onSubmit}
      />
    </QueryClientProvider>
  )
}

describe("TransactionForm saveAsTemplate toggle", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders template toggle switch in off state by default", () => {
    renderForm()
    const toggle = screen.getByRole("switch", { name: "Simpan sebagai template" })
    expect(toggle).toBeInTheDocument()
    expect(toggle).toHaveAttribute("aria-checked", "false")
    expect(screen.queryByLabelText("Nama Template")).not.toBeInTheDocument()
  })

  it("reveals template name and save amount toggle when switched on", () => {
    renderForm()
    const toggle = screen.getByRole("switch", { name: "Simpan sebagai template" })
    fireEvent.click(toggle)

    expect(toggle).toHaveAttribute("aria-checked", "true")
    const nameInput = screen.getByLabelText("Nama Template") as HTMLInputElement
    expect(nameInput).toBeInTheDocument()
    expect(nameInput.value).toBe("Makan Siang")

    const amountToggle = screen.getByRole("switch", { name: "Simpan jumlah nominal" })
    expect(amountToggle).toBeInTheDocument()
    expect(amountToggle).toHaveAttribute("aria-checked", "true")
  })

  it("submits with templateOptions when toggle is on", async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined)
    renderForm(handleSubmit)

    const saveBtn = screen.getByRole("button", { name: "Simpan" })
    await waitFor(() => expect(saveBtn).not.toBeDisabled())

    const toggle = screen.getByRole("switch", { name: "Simpan sebagai template" })
    fireEvent.click(toggle)

    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "expense",
          amount: "35.000",
          description: "Makan Siang",
        }),
        {
          saveAsTemplate: true,
          templateName: "Makan Siang",
          saveAmount: true,
        }
      )
    })
  })

  it("allows turning off save amount toggle", async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined)
    renderForm(handleSubmit)

    const saveBtn = screen.getByRole("button", { name: "Simpan" })
    await waitFor(() => expect(saveBtn).not.toBeDisabled())

    const toggle = screen.getByRole("switch", { name: "Simpan sebagai template" })
    fireEvent.click(toggle)

    const amountToggle = screen.getByRole("switch", { name: "Simpan jumlah nominal" })
    fireEvent.click(amountToggle)
    expect(amountToggle).toHaveAttribute("aria-checked", "false")

    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          saveAsTemplate: true,
          saveAmount: false,
        })
      )
    })
  })

  it("submits without templateOptions when toggle is off", async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined)
    renderForm(handleSubmit)

    const saveBtn = screen.getByRole("button", { name: "Simpan" })
    await waitFor(() => expect(saveBtn).not.toBeDisabled())

    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "expense",
          amount: "35.000",
          description: "Makan Siang",
        })
      )
    })
  })
})

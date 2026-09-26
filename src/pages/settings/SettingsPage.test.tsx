import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import SettingsPage from "./SettingsPage"
import { toast } from "sonner"

const mockToggleSubscription = vi.fn()
const mockUsePushNotifications = vi.fn()

vi.mock("@/hooks/usePushNotifications", () => ({
  usePushNotifications: (...args: unknown[]) => mockUsePushNotifications(...args),
}))

vi.mock("@/stores/auth-store", () => ({
  useAuthStore: () => ({
    reset: vi.fn(),
    profile: { id: "user-123", email: "test@example.com" },
  }),
}))

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}))

vi.mock("@/services/supabase", () => ({
  supabase: {
    auth: {
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}))

vi.mock("@/hooks/useBalanceRecalculation", () => ({
  useBalanceRecalculation: () => ({
    preview: [],
    isPreviewLoading: false,
    isPreviewError: false,
    previewError: null,
    summary: null,
    applyRecalculation: vi.fn(),
    isApplying: false,
    applyError: null,
    refetchPreview: vi.fn(),
  }),
}))

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUsePushNotifications.mockReturnValue({
      isSupported: true,
      permission: "granted",
      isSubscribed: false,
      isLoading: false,
      isToggling: false,
      error: null,
      toggleSubscription: mockToggleSubscription,
    })
  })

  it("renders settings page with notifikasi card and switch", () => {
    render(<SettingsPage />)

    expect(screen.getByRole("heading", { name: "Pengaturan" })).toBeInTheDocument()
    expect(screen.getByText("Notifikasi")).toBeInTheDocument()
    expect(screen.getByText("Tagihan Auto-Debit")).toBeInTheDocument()
    expect(screen.getByRole("switch", { name: "Toggle notifikasi push" })).toBeInTheDocument()
  })

  it("calls toggleSubscription when switch is clicked", async () => {
    mockToggleSubscription.mockResolvedValue(true)

    render(<SettingsPage />)

    const switchEl = screen.getByRole("switch", { name: "Toggle notifikasi push" })
    fireEvent.click(switchEl)

    await waitFor(() => {
      expect(mockToggleSubscription).toHaveBeenCalledWith(true)
      expect(toast.success).toHaveBeenCalledWith("Notifikasi push berhasil diaktifkan")
    })
  })

  it("displays message when push notifications are unsupported", () => {
    mockUsePushNotifications.mockReturnValue({
      isSupported: false,
      permission: "unsupported",
      isSubscribed: false,
      isLoading: false,
      isToggling: false,
      error: null,
      toggleSubscription: mockToggleSubscription,
    })

    render(<SettingsPage />)

    expect(
      screen.getByText("Push notification tidak didukung pada browser atau perangkat ini.")
    ).toBeInTheDocument()
    const switchEl = screen.getByRole("switch", { name: "Toggle notifikasi push" })
    expect(switchEl).toBeDisabled()
  })

  it("displays error message when pushError occurs", () => {
    mockUsePushNotifications.mockReturnValue({
      isSupported: true,
      permission: "denied",
      isSubscribed: false,
      isLoading: false,
      isToggling: false,
      error: "Izin notifikasi diblokir di browser.",
      toggleSubscription: mockToggleSubscription,
    })

    render(<SettingsPage />)

    expect(screen.getByRole("alert")).toHaveTextContent("Izin notifikasi diblokir di browser.")
  })

  it("renders test notification button when subscribed and triggers notification", async () => {
    const mockShowNotification = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "serviceWorker", {
      value: {
        getRegistration: vi.fn().mockResolvedValue({
          showNotification: mockShowNotification,
        }),
      },
      configurable: true,
    })

    mockUsePushNotifications.mockReturnValue({
      isSupported: true,
      permission: "granted",
      isSubscribed: true,
      isLoading: false,
      isToggling: false,
      error: null,
      toggleSubscription: mockToggleSubscription,
    })

    render(<SettingsPage />)

    const testBtn = screen.getByRole("button", { name: /Kirim Notifikasi Uji Coba/i })
    expect(testBtn).toBeInTheDocument()

    fireEvent.click(testBtn)

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith(
        "Tagihan Auto-Debit Berhasil",
        expect.objectContaining({
          body: expect.stringContaining("Tagihan Listrik PLN"),
        })
      )
      expect(toast.success).toHaveBeenCalledWith("Notifikasi uji coba dikirim ke status bar!")
    })
  })
})

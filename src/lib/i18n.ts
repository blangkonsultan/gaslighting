/**
 * Centralized Indonesian (id-ID) string dictionary for UI, navigation,
 * validation, and domain error messages.
 */
export const t = {
  // Navigation
  nav_dashboard: "Dashboard",
  nav_accounts: "Rekening",
  nav_new_transaction: "Transaksi Baru",
  nav_history: "Riwayat",
  nav_bills: "Tagihan",
  nav_reports: "Laporan",
  nav_settings: "Pengaturan",
  nav_manage_categories: "Kelola Kategori",
  nav_manage_account_presets: "Kelola Preset Rekening",
  nav_categories_short: "Kategori",
  nav_presets_short: "Preset",
  nav_more: "Lainnya",
  nav_bills_auto_debit: "Tagihan (Auto-Debit)",

  // Dashboard
  dashboard_greeting: (name: string) => `Halo, ${name}!`,
  dashboard_summary_subtitle: "Ringkasan keuanganmu hari ini",
  dashboard_total_balance: "Total Saldo",
  dashboard_monthly_income: "Pemasukan Bulan Ini",
  dashboard_monthly_expense: "Pengeluaran Bulan Ini",
  dashboard_recent_transactions: "Transaksi Terakhir",
  dashboard_loading: "Memuat…",
  dashboard_error_loading_tx: "Gagal memuat transaksi.",
  dashboard_empty_tx_title: "Belum ada transaksi",
  dashboard_empty_tx_desc: "Mulai tambahkan pemasukan atau pengeluaran pertamamu",
  dashboard_balance_warning_msg:
    "Beberapa rekening memiliki saldo yang tidak konsisten. Periksa tab Rekening untuk detail.",
  dashboard_balance_warning_action: "Lihat Rekening",

  // Account Info Panel & Projections
  account_info_selected_account: "Rekening dipilih:",
  account_info_current_balance: "Saldo saat ini:",
  account_info_projected_tx: "Saldo setelah transaksi:",
  account_info_projected_bill_today: "Saldo setelah debit pertama (hari ini):",
  account_info_projected_bill_start_date: "Saldo setelah debit pertama (pada tanggal mulai):",

  // Not Found Page
  not_found_code: "404",
  not_found_title: "Halaman tidak ditemukan",
  not_found_desc: "Halaman yang kamu cari tidak ada atau mungkin telah dipindahkan.",
  not_found_go_home: "Kembali ke beranda",
  not_found_go_dashboard: "Ke dashboard",
  not_found_go_login: "Ke halaman masuk",

  // Validation messages (Zod)
  val_email_invalid: "Email tidak valid",
  val_password_min: "Password minimal 6 karakter",
  val_name_required: "Nama lengkap wajib diisi",
  val_account_name_required: "Nama rekening wajib diisi",
  val_account_type_required: "Pilih tipe rekening",
  val_initial_balance_required: "Saldo awal wajib diisi",
  val_balance_required: "Saldo wajib diisi",
  val_amount_required: "Jumlah wajib diisi",
  val_balance_format_invalid: "Format saldo tidak valid. Contoh: 150.000.000",
  val_amount_format_invalid: "Format jumlah tidak valid. Contoh: 150.000.000",
  val_balance_negative: "Saldo awal tidak boleh negatif",
  val_balance_not_negative: "Saldo tidak boleh negatif",
  val_amount_positive: "Jumlah harus lebih dari 0",
  val_account_required: "Pilih rekening",
  val_category_required: "Pilih kategori",
  val_description_required: "Deskripsi wajib diisi",
  val_date_required: "Tanggal wajib diisi",
  val_date_max_today: "Tanggal tidak boleh melebihi hari ini",
  val_from_account_required: "Pilih rekening asal",
  val_to_account_required: "Pilih rekening tujuan",
  val_same_account_error: "Rekening asal dan tujuan tidak boleh sama",
  val_bill_name_required: "Nama tagihan wajib diisi",
  val_bill_start_date_min_today: "Tanggal mulai minimal hari ini",
  val_category_name_required: "Nama kategori wajib diisi",
  val_icon_required: "Ikon wajib diisi",
  val_color_required: "Warna wajib diisi",
  val_preset_name_required: "Nama preset wajib diisi",

  // Transfer RPC & Service Errors
  err_transfer_failed: "Gagal memproses transfer.",
  err_transfer_same_account: "Rekening asal dan tujuan tidak boleh sama.",
  err_transfer_insufficient_balance: "Saldo tidak cukup.",
  err_transfer_insufficient_balance_reverse:
    "Saldo rekening tujuan tidak cukup untuk membatalkan/ubah transfer.",
  err_transfer_source_not_found: "Rekening asal tidak ditemukan.",
  err_transfer_dest_not_found: "Rekening tujuan tidak ditemukan.",
  err_transfer_not_found: "Transfer tidak ditemukan.",
} as const

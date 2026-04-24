# Gaslighting: Agile Product Documentation (Updated)

**Project Name:** Gaslighting (Bagas-Liya-Budgeting)  
**Description:** Multi-user, multi-account financial management application with automated bill tracking, internal transfers, and interactive data visualization.  
**Core Tech Stack:** React (Vite) + TypeScript, Tailwind CSS, Shadcn UI, Recharts/Chart.js, Supabase (PostgreSQL, Auth, RLS, Edge Functions - Deno/TS), Vitest, Vercel.

---

## 1. UI/UX Design Guidelines (Color Palette)

Aplikasi ini menggunakan tema earthy/vintage yang menenangkan. Dashboard dan Laporan harus menggunakan visualisasi yang konsisten dengan palet berikut:

* **Primary:** `#9AB17A` (Sage) - Buttons, Active States, Success, Primary Chart Bars
* **Secondary:** `#C3CC9B` (Olive) - Hover States, Secondary Accents, Secondary Chart Lines
* **Background:** `#FBE8CE` (Warm Cream) - Main App Background
* **Surface/Card:** `#E4DFB5` (Beige) - Cards, Modals, Input Fields, Chart Backgrounds

---

## 2. Core Business Rules & Application Flow

1. **Role Management:** Admin diatur secara manual di dalam database (Supabase). Semua pendaftaran akun baru melalui aplikasi akan secara otomatis mendapatkan peran standar sebagai `user`.
2. **Mandatory Onboarding:** User baru yang mendaftar tidak dapat melihat dashboard atau melakukan transaksi sebelum menyelesaikan fase Onboarding (pilih rekening dan saldo awal >= 0).
3. **Data Integrity:** Laporan dan Dashboard harus mencerminkan data real-time dari PostgreSQL melalui integrasi Supabase yang aman (RLS).
4. **Interactive Visualization:** Grafik harus mendukung interaksi user seperti hover untuk detail, filtering rentang waktu, dan perbandingan antar rekening.

---

## 3. Product Backlog (Prioritized)

### Epic 1: Foundation & User Onboarding
* **User Auth & Role Management:** Setup Supabase Auth dan database trigger untuk role `user`.
* **Database Schema & RLS:** Pembuatan tabel utama dan Row Level Security.
* **Mandatory Onboarding Flow:** Setup rekening dan saldo awal bagi pengguna baru.

### Epic 2: Core Financial Engine
* **Account Management:** CRUD rekening pribadi.
* **Transaction Entry:** Form input Pemasukan & Pengeluaran dengan validasi TypeScript.
* **Internal Transfers:** Logika "Transfer" antar rekening dengan atomic transaction.

### Epic 3: Interactive Dashboard (New)
* **Summary Cards:** Widget saldo total, total pemasukan bulan ini, dan total pengeluaran bulan ini.
* **Cash Flow Chart:** Grafik garis/batang interaktif yang menunjukkan tren arus kas harian/mingguan.
* **Expense Distribution:** Grafik lingkaran (Pie/Donut) yang menunjukkan persentase pengeluaran per kategori.

### Epic 4: Advanced Reporting (New)
* **Transaction History:** Tabel laporan dengan fitur filter (tanggal, kategori, rekening) dan pencarian.
* **Monthly Financial Report:** Halaman laporan bulanan yang merangkum kesehatan finansial user.
* **Export Data:** Fitur untuk mengekspor laporan transaksi ke format CSV/PDF.

### Epic 5: Smart Automation
* **Auto-Debit System:** Penjadwalan tagihan berulang.
* **Balance Validation Engine:** Edge Function untuk pengecekan saldo otomatis.

---

## 4. Sprint Plan (2-Week Iterations)

### Sprint 1: TypeScript Foundation & Onboarding
* Setup environment, Supabase types, Auth, dan Mandatory Onboarding Setup.

### Sprint 2: Core Transactions & Simple Dashboard
* UI Account/Wallet management.
* Form Pemasukan/Pengeluaran.
* Implementasi Summary Cards sederhana pada Dashboard (Total Saldo).

### Sprint 3: Internal Transfers & Interactive Visuals
* Logika Transfer antar rekening.
* Implementasi Recharts/Chart.js untuk Cash Flow Chart dan Expense Distribution.
* Admin Panel untuk manajemen kategori global.

### Sprint 4: Advanced Reporting & Export
* Pembuatan tabel laporan lengkap dengan filter dinamis.
* Implementasi fitur export CSV/PDF.
* UI Pending Bill untuk tagihan yang gagal karena saldo tidak cukup.

### Sprint 5: Smart Automation & Final Polishing
* Pembuatan Supabase Edge Function untuk Auto-Debit.
* Optimasi performa query laporan dan dashboard.
* Final UI polishing sesuai palet earthy/vintage.

---

## 5. User Stories & Acceptance Criteria

### User Story: Interactive Financial Dashboard
**As a** Regular User,  
**I want to** see a visual summary of my finances on the dashboard,  
**So that** I can quickly understand my spending habits and current net worth.

* **Acceptance Criteria:**
    * **Given** the user is logged in, **When** they view the dashboard, **Then** they see interactive charts for Cash Flow and Expense Distribution.
    * **Given** the Expense Chart, **When** I hover over a category segment, **Then** the UI shows the exact amount and percentage of that category.
    * **Given** a change in data (new transaction), **When** the dashboard is viewed, **Then** the charts must reflect the updated data immediately.
    * **Technical:** Gunakan library visualisasi yang ringan seperti Recharts dan pastikan integrasi TypeScript pada data props.

### User Story: Filterable Transaction Reports
**As a** Regular User,  
**I want to** generate a detailed report of my transactions with filters,  
**So that** I can analyze my expenses for specific categories or time periods.

* **Acceptance Criteria:**
    * **Given** the Reports page, **When** I select a date range and a specific category, **Then** the table only displays transactions that match those criteria.
    * **Given** the filtered list, **When** I click the "Export" button, **Then** the system generates a downloadable file (CSV/PDF) containing the filtered data.
    * **Technical:** Gunakan server-side filtering atau optimal client-side filtering menggunakan TanStack Table.

---

## 6. Testing Strategy (Vitest)
* **Visualization Data Tests:** Pastikan fungsi transformator data mengonversi raw SQL data menjadi format yang benar untuk library chart.
* **Filter Logic Tests:** Unit test untuk memastikan fungsi filter pada laporan mengembalikan data yang akurat sesuai parameter user.
* **Auth Guard Tests:** Memastikan laporan user A tidak dapat diakses oleh user B melalui manipulasi URL/API.
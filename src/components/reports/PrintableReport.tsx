import type { MonthlyReport } from "@/lib/reports/monthly"
import type { TransactionListRow } from "@/services/transactions.service"
import { formatCurrency, formatDate, formatPercentage } from "@/lib/formatters"
import { formatTransactionType } from "@/lib/reports/export-csv"

export interface PrintableReportProps {
  monthLabel: string
  report: MonthlyReport
  transactions: TransactionListRow[]
  userName?: string
  printDate?: string
}

export function PrintableReport({
  monthLabel,
  report,
  transactions,
  userName = "Pengguna",
  printDate = formatDate(new Date()),
}: PrintableReportProps) {
  const isSurplus = report.netTotal >= 0

  return (
    <div className="print-document bg-white text-neutral-800 p-5 sm:p-8 max-w-3xl mx-auto font-sans leading-relaxed print:p-0 print:max-w-none print:w-full print:m-0">
      {/* Formal Minimalist Header - Border Minimal */}
      <div className="border-b border-neutral-200 pb-4 mb-5">
        <div className="flex justify-between items-baseline gap-2">
          <div>
            <span className="text-[10px] font-bold tracking-[0.2em] text-neutral-400 uppercase block">
              GASLIGHTING
            </span>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 mt-0.5">
              Laporan Keuangan Bulanan
            </h1>
          </div>
          <div className="text-right text-xs text-neutral-500 space-y-0.5 shrink-0">
            <p>
              <span className="text-neutral-400 font-normal">Periode:</span>{" "}
              <strong className="font-semibold text-neutral-900">{monthLabel}</strong>
            </p>
            <p>
              <span className="text-neutral-400 font-normal">Pengguna:</span>{" "}
              <strong className="font-semibold text-neutral-900">{userName}</strong>
            </p>
            <p className="text-[10px] text-neutral-400 pt-0.5">
              Tanggal Cetak: {printDate}
            </p>
          </div>
        </div>
      </div>

      {/* Ringkasan Arus Kas (Breathable Figures without heavy borders) */}
      <div className="page-break-avoid mb-6">
        <div className="py-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              Total Pemasukan
            </p>
            <p className="text-base font-bold text-neutral-900 mt-1 tabular-nums">
              {formatCurrency(report.incomeTotal)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              Total Pengeluaran
            </p>
            <p className="text-base font-bold text-neutral-900 mt-1 tabular-nums">
              {formatCurrency(report.expenseTotal)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              Arus Kas Bersih
            </p>
            <p
              className={`text-base font-bold mt-1 tabular-nums ${
                isSurplus ? "text-neutral-900" : "text-rose-700"
              }`}
            >
              {isSurplus ? "+" : ""}
              {formatCurrency(report.netTotal)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              Tingkat Tabungan
            </p>
            <p className="text-base font-bold text-neutral-900 mt-1 tabular-nums">
              {formatPercentage(report.savingsRate)}
            </p>
          </div>
        </div>
      </div>

      {/* Breakdown Kategori (Quiet, border-minimal layout) */}
      <div className="page-break-avoid grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 text-xs">
        {/* Pengeluaran per Kategori */}
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-2 pb-1 border-b border-neutral-100">
            Pengeluaran per Kategori
          </h2>
          {report.expenseByCategory.length === 0 ? (
            <p className="text-xs text-neutral-400 italic py-1">Tidak ada pengeluaran.</p>
          ) : (
            <div className="space-y-1.5 pt-1">
              {report.expenseByCategory.map((cat) => (
                <div key={cat.name} className="flex justify-between items-center text-xs">
                  <span className="text-neutral-700 truncate pr-2">{cat.name}</span>
                  <div className="text-right shrink-0 tabular-nums">
                    <span className="font-medium text-neutral-900 mr-2">
                      {formatCurrency(cat.amount)}
                    </span>
                    <span className="text-neutral-400 text-[11px]">
                      {formatPercentage(cat.percentage)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pemasukan per Kategori */}
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-2 pb-1 border-b border-neutral-100">
            Pemasukan per Kategori
          </h2>
          {report.incomeByCategory.length === 0 ? (
            <p className="text-xs text-neutral-400 italic py-1">Tidak ada pemasukan.</p>
          ) : (
            <div className="space-y-1.5 pt-1">
              {report.incomeByCategory.map((cat) => (
                <div key={cat.name} className="flex justify-between items-center text-xs">
                  <span className="text-neutral-700 truncate pr-2">{cat.name}</span>
                  <div className="text-right shrink-0 tabular-nums">
                    <span className="font-medium text-neutral-900 mr-2">
                      {formatCurrency(cat.amount)}
                    </span>
                    <span className="text-neutral-400 text-[11px]">
                      {formatPercentage(cat.percentage)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rincian Transaksi (Scroll-free, responsive ledger) */}
      <div className="mb-6">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-2 pb-1 border-b border-neutral-200 flex justify-between items-baseline">
          <span>Rincian Transaksi</span>
          <span className="text-[10px] font-normal text-neutral-400">{transactions.length} mutasi</span>
        </h2>
        {transactions.length === 0 ? (
          <p className="text-xs text-neutral-400 italic py-3">Tidak ada transaksi pada periode ini.</p>
        ) : (
          <div className="divide-y divide-neutral-100">
            {transactions.map((tx) => {
              const isIncome = tx.type === "income"
              return (
                <div
                  key={tx.id}
                  className="py-2.5 flex items-baseline justify-between gap-3 page-break-avoid"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-neutral-900 break-words leading-snug">
                      {tx.description || tx.categories?.name || "Transaksi"}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-neutral-400 mt-0.5 tabular-nums">
                      <span>{tx.transaction_date}</span>
                      <span>•</span>
                      <span>{tx.accounts?.name || "-"}</span>
                      {tx.categories?.name && (
                        <>
                          <span>•</span>
                          <span>{tx.categories.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0 whitespace-nowrap">
                    <p
                      className={`text-xs sm:text-sm font-semibold tabular-nums ${
                        isIncome ? "text-emerald-700" : "text-neutral-900"
                      }`}
                    >
                      {isIncome ? "+" : "-"}
                      {formatCurrency(tx.amount)}
                    </p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      {formatTransactionType(tx.type)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Clean Minimalist Footer */}
      <div className="pt-3 text-center text-[10px] text-neutral-400">
        <p>
          Dokumen resmi hasil generate sistem manajemen keuangan{" "}
          <strong className="font-semibold text-neutral-600">Gaslighting</strong>.
        </p>
      </div>
    </div>
  )
}

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
    <div className="print-document bg-white text-neutral-800 p-8 sm:p-10 max-w-4xl mx-auto font-sans leading-relaxed print:p-0 print:max-w-none print:w-full print:m-0">
      {/* Formal Minimalist Header */}
      <div className="border-b-2 border-neutral-900 pb-5 mb-6">
        <div className="flex justify-between items-baseline">
          <div>
            <span className="text-[10px] font-bold tracking-[0.25em] text-neutral-400 uppercase block">
              GASLIGHTING
            </span>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 mt-0.5">
              Laporan Keuangan Bulanan
            </h1>
          </div>
          <div className="text-right text-xs text-neutral-500 space-y-0.5">
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

      {/* Ringkasan Arus Kas (Open & Breathable) */}
      <div className="page-break-avoid mb-8">
        <div className="border-y border-neutral-200 py-3.5 grid grid-cols-2 sm:grid-cols-4 gap-4">
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

      {/* Breakdown Kategori (Clean, Quiet Lists) */}
      <div className="page-break-avoid grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8 text-xs">
        {/* Pengeluaran per Kategori */}
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-2 pb-1 border-b border-neutral-200">
            Pengeluaran per Kategori
          </h2>
          {report.expenseByCategory.length === 0 ? (
            <p className="text-xs text-neutral-400 italic py-2">Tidak ada pengeluaran.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-neutral-100 text-neutral-400 text-[10px]">
                  <th className="text-left py-1 font-medium">Kategori</th>
                  <th className="text-right py-1 font-medium">Nominal</th>
                  <th className="text-right py-1 font-medium w-12">Porsi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {report.expenseByCategory.map((cat) => (
                  <tr key={cat.name}>
                    <td className="py-1.5 text-neutral-700">{cat.name}</td>
                    <td className="py-1.5 text-right font-medium text-neutral-900 tabular-nums">
                      {formatCurrency(cat.amount)}
                    </td>
                    <td className="py-1.5 text-right text-neutral-400 tabular-nums text-[11px]">
                      {formatPercentage(cat.percentage)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pemasukan per Kategori */}
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-2 pb-1 border-b border-neutral-200">
            Pemasukan per Kategori
          </h2>
          {report.incomeByCategory.length === 0 ? (
            <p className="text-xs text-neutral-400 italic py-2">Tidak ada pemasukan.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-neutral-100 text-neutral-400 text-[10px]">
                  <th className="text-left py-1 font-medium">Kategori</th>
                  <th className="text-right py-1 font-medium">Nominal</th>
                  <th className="text-right py-1 font-medium w-12">Porsi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {report.incomeByCategory.map((cat) => (
                  <tr key={cat.name}>
                    <td className="py-1.5 text-neutral-700">{cat.name}</td>
                    <td className="py-1.5 text-right font-medium text-neutral-900 tabular-nums">
                      {formatCurrency(cat.amount)}
                    </td>
                    <td className="py-1.5 text-right text-neutral-400 tabular-nums text-[11px]">
                      {formatPercentage(cat.percentage)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Rincian Transaksi (Minimalist Formal Ledger) */}
      <div className="mb-8">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-2 pb-1 border-b border-neutral-900 flex justify-between items-baseline">
          <span>Rincian Transaksi</span>
          <span className="text-[10px] font-normal text-neutral-400">{transactions.length} transaksi</span>
        </h2>
        {transactions.length === 0 ? (
          <p className="text-xs text-neutral-400 italic py-4">Tidak ada transaksi pada periode ini.</p>
        ) : (
          <table className="w-full table-fixed text-[11px]">
            <colgroup>
              <col className="w-[15%]" />
              <col className="w-[12%]" />
              <col className="w-[16%]" />
              <col className="w-[16%]" />
              <col className="w-[23%]" />
              <col className="w-[18%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-neutral-300 text-neutral-400 text-[10px] uppercase tracking-wider">
                <th className="text-left py-1.5 font-medium whitespace-nowrap">Tanggal</th>
                <th className="text-left py-1.5 font-medium whitespace-nowrap">Tipe</th>
                <th className="text-left py-1.5 font-medium">Rekening</th>
                <th className="text-left py-1.5 font-medium">Kategori</th>
                <th className="text-left py-1.5 font-medium">Deskripsi</th>
                <th className="text-right py-1.5 font-medium whitespace-nowrap">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {transactions.map((tx) => {
                const isIncome = tx.type === "income"
                return (
                  <tr key={tx.id} className="hover:bg-neutral-50/50 align-top page-break-avoid">
                    <td className="py-2 text-neutral-500 whitespace-nowrap tabular-nums">
                      {tx.transaction_date}
                    </td>
                    <td className="py-2 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-medium ${
                          isIncome
                            ? "text-emerald-700"
                            : tx.type === "transfer"
                            ? "text-blue-700"
                            : "text-neutral-500"
                        }`}
                      >
                        {formatTransactionType(tx.type)}
                      </span>
                    </td>
                    <td className="py-2 text-neutral-600 break-words leading-snug pr-2">
                      {tx.accounts?.name || "-"}
                    </td>
                    <td className="py-2 text-neutral-600 break-words leading-snug pr-2">
                      {tx.categories?.name || "-"}
                    </td>
                    <td className="py-2 text-neutral-800 break-words leading-relaxed pr-2">
                      {tx.description || "-"}
                    </td>
                    <td
                      className={`py-2 text-right font-semibold whitespace-nowrap tabular-nums ${
                        isIncome ? "text-emerald-700" : "text-neutral-900"
                      }`}
                    >
                      {isIncome ? "+" : "-"}
                      {formatCurrency(tx.amount)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Clean Document Footer */}
      <div className="border-t border-neutral-200 pt-4 text-center text-[10px] text-neutral-400">
        <p>
          Dokumen resmi hasil generate sistem manajemen keuangan{" "}
          <strong className="font-semibold text-neutral-600">Gaslighting</strong>.
        </p>
      </div>
    </div>
  )
}

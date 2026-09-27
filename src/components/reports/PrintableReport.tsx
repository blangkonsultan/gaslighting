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
    <div className="print-document bg-white text-slate-800 p-6 sm:p-8 max-w-4xl mx-auto font-sans leading-relaxed print:p-0 print:max-w-none print:w-full print:m-0">
      {/* Header */}
      <div className="border-b-2 border-slate-300 pb-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              GASLIGHTING
            </h1>
            <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mt-0.5">
              Laporan Keuangan Bulanan
            </p>
          </div>
          <div className="text-right text-xs text-slate-500 space-y-1">
            <p>
              <span className="font-medium text-slate-700">Periode:</span>{" "}
              {monthLabel}
            </p>
            <p>
              <span className="font-medium text-slate-700">Pengguna:</span>{" "}
              {userName}
            </p>
            <p>
              <span className="font-medium text-slate-700">Tanggal Cetak:</span>{" "}
              {printDate}
            </p>
          </div>
        </div>
      </div>

      {/* Ringkasan Eksekutif */}
      <div className="page-break-avoid mb-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 mb-3 border-l-4 border-emerald-600 pl-2">
          Ringkasan Arus Kas
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-lg bg-slate-50 border border-slate-200">
          <div>
            <p className="text-xs text-slate-500">Total Pemasukan</p>
            <p className="text-base font-semibold text-emerald-700 mt-1">
              {formatCurrency(report.incomeTotal)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Total Pengeluaran</p>
            <p className="text-base font-semibold text-rose-700 mt-1">
              {formatCurrency(report.expenseTotal)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Arus Kas Bersih</p>
            <p
              className={`text-base font-semibold mt-1 ${
                isSurplus ? "text-emerald-700" : "text-rose-700"
              }`}
            >
              {formatCurrency(report.netTotal)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Tingkat Tabungan</p>
            <p className="text-base font-semibold text-slate-800 mt-1">
              {formatPercentage(report.savingsRate)}
            </p>
          </div>
        </div>
      </div>

      {/* Breakdown Kategori */}
      <div className="page-break-avoid grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        {/* Pengeluaran per Kategori */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 mb-3 border-l-4 border-rose-600 pl-2">
            Pengeluaran per Kategori
          </h2>
          {report.expenseByCategory.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Tidak ada pengeluaran.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="text-left py-1.5 font-medium">Kategori</th>
                  <th className="text-right py-1.5 font-medium">Nominal</th>
                  <th className="text-right py-1.5 font-medium">Porsi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.expenseByCategory.map((cat) => (
                  <tr key={cat.name}>
                    <td className="py-1.5 text-slate-700">{cat.name}</td>
                    <td className="py-1.5 text-right font-medium text-slate-900">
                      {formatCurrency(cat.amount)}
                    </td>
                    <td className="py-1.5 text-right text-slate-500">
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
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 mb-3 border-l-4 border-emerald-600 pl-2">
            Pemasukan per Kategori
          </h2>
          {report.incomeByCategory.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Tidak ada pemasukan.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="text-left py-1.5 font-medium">Kategori</th>
                  <th className="text-right py-1.5 font-medium">Nominal</th>
                  <th className="text-right py-1.5 font-medium">Porsi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.incomeByCategory.map((cat) => (
                  <tr key={cat.name}>
                    <td className="py-1.5 text-slate-700">{cat.name}</td>
                    <td className="py-1.5 text-right font-medium text-slate-900">
                      {formatCurrency(cat.amount)}
                    </td>
                    <td className="py-1.5 text-right text-slate-500">
                      {formatPercentage(cat.percentage)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Rincian Transaksi */}
      <div className="mb-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 mb-3 border-l-4 border-slate-400 pl-2">
          Rincian Transaksi ({transactions.length})
        </h2>
        {transactions.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Tidak ada transaksi pada periode ini.</p>
        ) : (
          <table className="w-full table-fixed text-[11px] border border-slate-200 rounded-lg overflow-hidden">
            <colgroup>
              <col className="w-[14%]" />
              <col className="w-[12%]" />
              <col className="w-[16%]" />
              <col className="w-[16%]" />
              <col className="w-[24%]" />
              <col className="w-[18%]" />
            </colgroup>
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-700">
              <tr>
                <th className="text-left py-2 px-2.5 font-semibold whitespace-nowrap">Tanggal</th>
                <th className="text-left py-2 px-2 font-semibold whitespace-nowrap">Tipe</th>
                <th className="text-left py-2 px-2.5 font-semibold">Rekening</th>
                <th className="text-left py-2 px-2.5 font-semibold">Kategori</th>
                <th className="text-left py-2 px-2.5 font-semibold">Deskripsi</th>
                <th className="text-right py-2 px-2.5 font-semibold whitespace-nowrap">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((tx) => {
                const isIncome = tx.type === "income"
                return (
                  <tr key={tx.id} className="hover:bg-slate-50/50 align-top page-break-avoid">
                    <td className="py-2 px-2.5 text-slate-600 whitespace-nowrap tabular-nums">
                      {tx.transaction_date}
                    </td>
                    <td className="py-2 px-2 whitespace-nowrap">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[9.5px] font-medium ${
                          isIncome
                            ? "bg-emerald-100 text-emerald-800"
                            : tx.type === "transfer"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {formatTransactionType(tx.type)}
                      </span>
                    </td>
                    <td className="py-2 px-2.5 text-slate-700 break-words leading-snug">
                      {tx.accounts?.name || "-"}
                    </td>
                    <td className="py-2.5 px-2.5 text-slate-700 break-words leading-snug">
                      {tx.categories?.name || "-"}
                    </td>
                    <td className="py-2 px-2.5 text-slate-800 break-words leading-relaxed">
                      {tx.description || "-"}
                    </td>
                    <td
                      className={`py-2 px-2.5 text-right font-semibold whitespace-nowrap tabular-nums ${
                        isIncome ? "text-emerald-700" : "text-slate-900"
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

      {/* Footer */}
      <div className="border-t border-slate-200 pt-4 text-center text-[10px] text-slate-400">
        <p>
          Dokumen ini digenerate secara otomatis oleh sistem manajemen keuangan{" "}
          <strong className="font-semibold text-slate-600">Gaslighting</strong>.
        </p>
      </div>
    </div>
  )
}

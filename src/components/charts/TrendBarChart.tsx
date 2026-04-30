import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from "recharts"
import type { MonthlyTrendPoint } from "@/lib/reports/monthly"
import { formatCurrency } from "@/lib/formatters"

interface TrendBarChartProps {
  data: MonthlyTrendPoint[]
}

function formatCompactIdr(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}jt`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}rb`
  if (value === 0) return "0"
  return value.toString()
}

export function TrendBarChart({ data }: TrendBarChartProps) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Belum ada data</p>
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--muted)" />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12 }}
          tickMargin={8}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10 }}
          tickFormatter={formatCompactIdr}
          width={50}
        />
        <Tooltip
          formatter={(value) => {
            const num = typeof value === "number" ? value : 0
            return [formatCurrency(num), ""]
          }}
          contentStyle={{
            backgroundColor: "var(--background)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
          }}
        />
        <Legend verticalAlign="bottom" align="center" iconType="rect" wrapperStyle={{ paddingTop: "16px" }} />
        <Bar dataKey="income" name="Pemasukan" fill="#9AB17A" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" name="Pengeluaran" fill="#6B6B6B" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

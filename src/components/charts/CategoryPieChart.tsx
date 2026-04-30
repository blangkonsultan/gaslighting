import { PieChart, Pie, ResponsiveContainer, Tooltip, Legend, Cell } from "recharts"
import type { CategoryBreakdown } from "@/lib/reports/monthly"
import { formatCurrency } from "@/lib/formatters"
import { getColorForIndex } from "./colors"

interface CategoryPieChartProps {
  data: CategoryBreakdown[]
  showLabels?: boolean
}

export function CategoryPieChart({ data, showLabels = false }: CategoryPieChartProps) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Belum ada data</p>
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          dataKey="amount"
          nameKey="name"
          innerRadius={55}
          outerRadius={90}
          label={showLabels ? (entry) => `${Math.round(entry.payload.percentage)}%` : undefined}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={getColorForIndex(index)} />
          ))}
        </Pie>
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
        <Legend
          verticalAlign="bottom"
          align="center"
          iconType="circle"
          wrapperStyle={{ paddingTop: "16px" }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

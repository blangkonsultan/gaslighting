import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { TrendBarChart } from "@/components/charts/TrendBarChart"
import type { MonthlyTrendPoint } from "@/lib/reports/monthly"

interface TrendSectionProps {
  data: MonthlyTrendPoint[]
  isLoading: boolean
}

export function TrendSection({ data, isLoading }: TrendSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Tren Pemasukan vs Pengeluaran</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="text-sm text-muted-foreground">Memuat…</p> : <TrendBarChart data={data} />}
      </CardContent>
    </Card>
  )
}

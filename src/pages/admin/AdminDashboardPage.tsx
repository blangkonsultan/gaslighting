import { Card, CardContent } from "@/components/ui/card"

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Dashboard Admin</h1>
          <p className="text-sm text-muted-foreground">Selamat datang di panel admin</p>
        </div>
      </div>

      <Card>
        <CardContent className="py-6">
          <p className="text-muted-foreground">Selamat datang admin</p>
        </CardContent>
      </Card>
    </div>
  )
}
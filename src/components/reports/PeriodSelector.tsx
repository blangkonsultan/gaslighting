import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { addMonthsYmd } from "@/lib/dates"
import { cn } from "@/lib/utils"

interface PeriodSelectorProps {
  monthKey: string
  onMonthChange: (monthKey: string) => void
  hasRecords: (monthKey: string) => boolean
}

const formatter = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" })
const currentMonthKey = new Date().toISOString().slice(0, 7)

export function PeriodSelector({ monthKey, onMonthChange, hasRecords }: PeriodSelectorProps) {
  const [year, month] = monthKey.split("-").map(Number)
  const displayDate = new Date(year, month - 1, 1)

  const [pendingMonth, setPendingMonth] = useState<string | null>(null)
  const isCurrentMonth = monthKey === currentMonthKey

  const handlePrev = () => {
    const prevMonth = addMonthsYmd(monthKey, -1)
    console.log("handlePrev:", { prevMonth, hasRecords: hasRecords(prevMonth) })
    if (hasRecords(prevMonth)) {
      onMonthChange(prevMonth)
    } else {
      setPendingMonth(prevMonth)
    }
  }

  const handleNext = () => {
    const nextMonth = addMonthsYmd(monthKey, 1)
    console.log("handleNext:", { nextMonth, hasRecords: hasRecords(nextMonth) })
    if (nextMonth > currentMonthKey) return
    if (hasRecords(nextMonth)) {
      onMonthChange(nextMonth)
    } else {
      setPendingMonth(nextMonth)
    }
  }

  const handleToday = () => {
    onMonthChange(currentMonthKey)
  }

  const confirmNav = () => {
    console.log("confirmNav:", { pendingMonth })
    if (pendingMonth) {
      onMonthChange(pendingMonth)
      setPendingMonth(null)
    }
  }

  const targetFormatter = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" })

  return (
    <>
      <ConfirmDialog
        open={pendingMonth !== null}
        onOpenChange={(open) => !open && setPendingMonth(null)}
        title="Bulan tanpa data laporan"
        description={`Bulan ${pendingMonth ? targetFormatter.format(new Date(Number(pendingMonth.split("-")[0]), Number(pendingMonth.split("-")[1]) - 1, 1)) : ""} tidak memiliki data transaksi. Tetap ingin pindah?`}
        confirmLabel="Pindah"
        onConfirm={confirmNav}
        variant="default"
      />
      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" size="icon-sm" onClick={handlePrev} className="touch-target">
          <ChevronLeft size={16} />
        </Button>
        <div className="flex items-center gap-2">
          <span className={cn("font-semibold", !isCurrentMonth && "text-primary")}>
            {formatter.format(displayDate)}
          </span>
          {!isCurrentMonth && (
            <Button variant="ghost" size="sm" onClick={handleToday} className="h-7 px-2 text-xs">
              Hari ini
            </Button>
          )}
        </div>
        <Button variant="outline" size="icon-sm" onClick={handleNext} disabled={isCurrentMonth} className="touch-target">
          <ChevronRight size={16} />
        </Button>
      </div>
    </>
  )
}

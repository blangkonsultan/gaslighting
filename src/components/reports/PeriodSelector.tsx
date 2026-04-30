import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { addMonthsYmd } from "@/lib/dates"

interface PeriodSelectorProps {
  monthKey: string
  onMonthChange: (monthKey: string) => void
}

const formatter = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" })
const currentMonthKey = new Date().toISOString().slice(0, 7)

export function PeriodSelector({ monthKey, onMonthChange }: PeriodSelectorProps) {
  const [year, month] = monthKey.split("-").map(Number)
  const displayDate = new Date(year, month - 1, 1)

  const handlePrev = () => {
    onMonthChange(addMonthsYmd(monthKey, -1))
  }

  const handleNext = () => {
    const nextMonth = addMonthsYmd(monthKey, 1)
    if (nextMonth <= currentMonthKey) {
      onMonthChange(nextMonth)
    }
  }

  const handleToday = () => {
    onMonthChange(currentMonthKey)
  }

  const isCurrentMonth = monthKey === currentMonthKey

  return (
    <div className="flex items-center justify-between gap-2">
      <Button variant="outline" size="icon-sm" onClick={handlePrev} className="touch-target">
        <ChevronLeft size={16} />
      </Button>
      <div className="flex items-center gap-2">
        <span className="font-semibold">{formatter.format(displayDate)}</span>
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
  )
}

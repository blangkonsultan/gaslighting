import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { addMonthsYmd, todayYmd } from "@/lib/dates"
import { cn } from "@/lib/utils"

interface PeriodSelectorProps {
  monthKey: string
  onMonthChange: (monthKey: string) => void
  minMonthKey: string | null
}

const formatter = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" })
const currentMonthKey = todayYmd().slice(0, 7)

export function PeriodSelector({ monthKey, onMonthChange, minMonthKey }: PeriodSelectorProps) {
  const [year, month] = monthKey.split("-").map(Number)
  const displayDate = new Date(year, month - 1, 1)
  const isCurrentMonth = monthKey === currentMonthKey
  const isAtLimit = minMonthKey !== null && monthKey <= minMonthKey

  const handlePrev = () => {
    if (isAtLimit) return
    onMonthChange(addMonthsYmd(monthKey, -1))
  }

  const handleNext = () => {
    const nextMonth = addMonthsYmd(monthKey, 1)
    if (nextMonth > currentMonthKey) return
    onMonthChange(nextMonth)
  }

  const handleToday = () => {
    onMonthChange(currentMonthKey)
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <Button variant="outline" size="icon-sm" onClick={handlePrev} disabled={isAtLimit} className="touch-target">
        <ChevronLeft size={16} />
      </Button>
      <div className="flex items-center gap-2">
        <span className={cn("font-semibold", !isCurrentMonth && "text-primary")}>
          {formatter.format(displayDate)}
        </span>
        {!isCurrentMonth && (
          <Button variant="outline" size="sm" onClick={handleToday} className="h-7 px-2 text-xs">
            Bulan ini
          </Button>
        )}
      </div>
      <Button variant="outline" size="icon-sm" onClick={handleNext} disabled={isCurrentMonth} className="touch-target">
        <ChevronRight size={16} />
      </Button>
    </div>
  )
}

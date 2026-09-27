import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatIdrIntegerInput, parseIdrInteger } from "@/lib/money"
import { todayYmd } from "@/lib/dates"
import type { Account, Category, TransactionFilters } from "@/types/financial"
import { Hash } from "lucide-react"

export interface TransactionFilterSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: TransactionFilters
  onApplyFilters: (filters: Partial<TransactionFilters>) => void
  onResetFilters: () => void
  accounts: Account[]
  categories: Category[]
  userTags: string[]
}

const TYPE_OPTIONS = [
  { value: "", label: "Semua" },
  { value: "expense", label: "Pengeluaran" },
  { value: "income", label: "Pemasukan" },
  { value: "transfer", label: "Transfer" },
]

function FilterSheetForm({
  onOpenChange,
  filters,
  onApplyFilters,
  onResetFilters,
  accounts = [],
  categories = [],
  userTags = [],
}: Omit<TransactionFilterSheetProps, "open">) {
  const [localType, setLocalType] = useState<string>(filters.type ?? "")
  const [localAccountId, setLocalAccountId] = useState<string>(filters.accountId ?? "")
  const [localCategoryId, setLocalCategoryId] = useState<string>(filters.categoryId ?? "")
  const [localDateFrom, setLocalDateFrom] = useState<string>(filters.dateFrom ?? "")
  const [localDateTo, setLocalDateTo] = useState<string>(filters.dateTo ?? "")
  const [localMinStr, setLocalMinStr] = useState<string>(
    filters.amountMin != null ? formatIdrIntegerInput(String(filters.amountMin)) : ""
  )
  const [localMaxStr, setLocalMaxStr] = useState<string>(
    filters.amountMax != null ? formatIdrIntegerInput(String(filters.amountMax)) : ""
  )
  const [localTags, setLocalTags] = useState<string[]>(filters.tags ?? [])

  function toggleTag(tag: string) {
    if (localTags.includes(tag)) {
      setLocalTags(localTags.filter((t) => t !== tag))
    } else {
      setLocalTags([...localTags, tag])
    }
  }

  function handleApply() {
    const minVal = parseIdrInteger(localMinStr)
    const maxVal = parseIdrInteger(localMaxStr)

    onApplyFilters({
      type: localType || undefined,
      accountId: localAccountId || undefined,
      categoryId: localCategoryId || undefined,
      dateFrom: localDateFrom || undefined,
      dateTo: localDateTo || undefined,
      amountMin: Number.isFinite(minVal) && minVal > 0 ? minVal : undefined,
      amountMax: Number.isFinite(maxVal) && maxVal > 0 ? maxVal : undefined,
      tags: localTags.length > 0 ? localTags : undefined,
    })
    onOpenChange(false)
  }

  function handleReset() {
    setLocalType("")
    setLocalAccountId("")
    setLocalCategoryId("")
    setLocalDateFrom("")
    setLocalDateTo("")
    setLocalMinStr("")
    setLocalMaxStr("")
    setLocalTags([])
    onResetFilters()
    onOpenChange(false)
  }

  const categoryOptions = categories.filter((c) => {
    if (!localType || localType === "transfer") return true
    return c.type === localType
  })

  return (
    <>
      <SheetHeader className="p-4 border-b border-border bg-card/40">
        <SheetTitle className="text-base font-bold">Filter Lanjutan</SheetTitle>
        <SheetDescription className="text-xs text-muted-foreground">
          Saring transaksi berdasarkan tipe, nominal, rentang tanggal, atau tag.
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Tipe Transaksi */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Tipe Transaksi
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setLocalType(opt.value)}
                className={`text-xs py-2 px-1 rounded-md border text-center font-medium transition-colors touch-target ${
                  localType === opt.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border/80 text-foreground hover:bg-muted"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Rekening & Kategori */}
        <div className="grid grid-cols-1 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Rekening
            </Label>
            <Select value={localAccountId} onValueChange={(v) => setLocalAccountId(v ?? "")}>
              <SelectTrigger className="touch-target w-full text-xs">
                <SelectValue placeholder="Semua Rekening" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="">Semua Rekening</SelectItem>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Kategori
            </Label>
            <Select value={localCategoryId} onValueChange={(v) => setLocalCategoryId(v ?? "")}>
              <SelectTrigger className="touch-target w-full text-xs">
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="">Semua Kategori</SelectItem>
                  {categoryOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Rentang Tanggal */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Rentang Tanggal
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-muted-foreground block mb-1">Dari</span>
              <Input
                type="date"
                value={localDateFrom}
                max={localDateTo || todayYmd()}
                onChange={(e) => setLocalDateFrom(e.target.value)}
                className="touch-target text-xs"
              />
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block mb-1">Sampai</span>
              <Input
                type="date"
                value={localDateTo}
                min={localDateFrom}
                max={todayYmd()}
                onChange={(e) => setLocalDateTo(e.target.value)}
                className="touch-target text-xs"
              />
            </div>
          </div>
        </div>

        {/* Rentang Nominal */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Rentang Nominal (IDR)
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-muted-foreground block mb-1">Min (Rp)</span>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={localMinStr}
                onChange={(e) => setLocalMinStr(formatIdrIntegerInput(e.target.value))}
                className="touch-target text-xs tabular-nums text-right"
              />
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block mb-1">Maks (Rp)</span>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={localMaxStr}
                onChange={(e) => setLocalMaxStr(formatIdrIntegerInput(e.target.value))}
                className="touch-target text-xs tabular-nums text-right"
              />
            </div>
          </div>
        </div>

        {/* Tag Cloud Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Hash size={13} />
              <span>Tag Transaksi</span>
            </Label>
            {localTags.length > 0 && (
              <button
                type="button"
                onClick={() => setLocalTags([])}
                className="text-[11px] text-muted-foreground hover:text-foreground"
              >
                Reset tag
              </button>
            )}
          </div>

          {userTags.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              Belum ada tag pada transaksi Anda. Buat tag saat menambah transaksi.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {userTags.map((tag) => {
                const isSelected = localTags.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`text-xs py-1 px-2.5 rounded-full border transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary font-medium"
                        : "bg-card border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <SheetFooter className="p-4 border-t border-border bg-card/30 flex flex-row gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1 touch-target text-xs"
          onClick={handleReset}
        >
          Reset Semua
        </Button>
        <Button
          type="button"
          className="flex-1 touch-target text-xs font-semibold bg-primary text-primary-foreground"
          onClick={handleApply}
        >
          Terapkan Filter
        </Button>
      </SheetFooter>
    </>
  )
}

export function TransactionFilterSheet(props: TransactionFilterSheetProps) {
  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col p-0 bg-background overflow-hidden"
      >
        {props.open && <FilterSheetForm {...props} />}
      </SheetContent>
    </Sheet>
  )
}

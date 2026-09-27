import { useState, type KeyboardEvent } from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { X, Hash, Plus } from "lucide-react"
import { normalizeTag } from "@/lib/utils"
export interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  suggestedTags?: string[]
  disabled?: boolean
  placeholder?: string
}


const DEFAULT_POPULAR_TAGS = [
  "#kebutuhan",
  "#makan",
  "#liburan",
  "#belanja",
  "#keluarga",
  "#tagihan",
]

export function TagInput({
  value = [],
  onChange,
  suggestedTags = [],
  disabled = false,
  placeholder = "Ketik tag lalu tekan Enter…",
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("")

  const allSuggestions = Array.from(
    new Set([...suggestedTags, ...DEFAULT_POPULAR_TAGS])
  ).filter((tag) => !value.includes(tag))

  function addTag(tagText: string) {
    const normalized = normalizeTag(tagText)
    if (!normalized || value.includes(normalized)) return
    onChange([...value, normalized])
    setInputValue("")
  }

  function removeTag(tagToRemove: string) {
    onChange(value.filter((t) => t !== tagToRemove))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault()
      if (inputValue.trim()) {
        addTag(inputValue)
      }
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Active tags */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5" data-testid="active-tags-container">
          {value.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-xs py-1 px-2.5 flex items-center gap-1.5 bg-primary/15 text-primary-foreground border-primary/20 hover:bg-primary/20 transition-colors"
            >
              <span>{tag}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="rounded-full hover:bg-black/10 p-0.5 inline-flex items-center justify-center transition-colors"
                  aria-label={`Hapus tag ${tag}`}
                >
                  <X size={12} />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Input box */}
      <div className="relative">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (inputValue.trim()) {
              addTag(inputValue)
            }
          }}
          disabled={disabled}
          placeholder={placeholder}
          className="touch-target pl-8 text-sm"
          aria-label="Input tag transaksi"
        />
        <Hash
          size={15}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
      </div>

      {/* Quick suggestions */}
      {!disabled && allSuggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-muted-foreground mr-1">Saran:</span>
          {allSuggestions.slice(0, 5).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addTag(suggestion)}
              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-border/70 bg-card/60 text-muted-foreground hover:bg-card hover:text-foreground transition-colors"
            >
              <Plus size={10} />
              <span>{suggestion}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

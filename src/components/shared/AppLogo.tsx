import { cn } from "@/lib/utils"

export interface AppLogoProps {
  size?: "sm" | "md" | "lg" | "xl" | number
  showText?: boolean
  className?: string
  textClassName?: string
  subtitle?: string
}

const SIZE_MAP = {
  sm: 28,
  md: 32,
  lg: 56,
  xl: 64,
}

export function AppLogo({
  size = "md",
  showText = false,
  className,
  textClassName,
  subtitle,
}: AppLogoProps) {
  const pixelSize = typeof size === "number" ? size : SIZE_MAP[size] || 32

  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <img
        src="/favicon.svg"
        alt="Gaslighting Logo"
        width={pixelSize}
        height={pixelSize}
        className={cn(
          "shrink-0 rounded-xl object-contain drop-shadow-xs transition-transform",
          pixelSize >= 48 ? "rounded-2xl" : "rounded-lg"
        )}
        style={{ width: `${pixelSize}px`, height: `${pixelSize}px` }}
      />
      {showText && (
        <div className="flex flex-col leading-none">
          <span
            className={cn(
              "font-black tracking-tight text-[#2D2A26]",
              pixelSize <= 28 ? "text-base" : pixelSize <= 36 ? "text-lg" : "text-xl",
              textClassName
            )}
          >
            Gaslighting
          </span>
          {subtitle && (
            <span className="text-[11px] text-[#6F6B58] mt-0.5 leading-tight font-normal">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

import type { ReactNode } from "react"
import {
  Bookmark,
  Briefcase,
  Car,
  Circle,
  Coffee,
  Film,
  Gift,
  GraduationCap,
  Heart,
  Home,
  Laptop,
  PiggyBank,
  ShoppingBag,
  Tag,
  TrendingUp,
  Utensils,
  Wallet,
  Zap,
} from "lucide-react"

const ICON_MAP: Record<string, typeof Utensils> = {
  utensils: Utensils,
  car: Car,
  briefcase: Briefcase,
  laptop: Laptop,
  "trending-up": TrendingUp,
  gift: Gift,
  home: Home,
  zap: Zap,
  heart: Heart,
  film: Film,
  "graduation-cap": GraduationCap,
  "shopping-bag": ShoppingBag,
  "piggy-bank": PiggyBank,
  wallet: Wallet,
  coffee: Coffee,
  tag: Tag,
  circle: Circle,
}

export interface CategoryIconProps {
  iconName?: string | null
  size?: number
  className?: string
  fallback?: ReactNode
}

function isEmoji(str: string): boolean {
  return str.length <= 4 && /\p{Extended_Pictographic}/u.test(str)
}

export function CategoryIcon({
  iconName,
  size = 14,
  className,
  fallback,
}: CategoryIconProps) {
  if (!iconName) {
    return <>{fallback ?? <Bookmark size={size} className={className} />}</>
  }

  const trimmed = iconName.trim().toLowerCase()

  if (isEmoji(iconName.trim())) {
    return (
      <span
        className={className}
        style={{ fontSize: `${size}px`, lineHeight: 1 }}
        aria-hidden="true"
      >
        {iconName.trim()}
      </span>
    )
  }

  const IconComponent = ICON_MAP[trimmed]
  if (IconComponent) {
    return <IconComponent size={size} className={className} />
  }

  return <>{fallback ?? <Bookmark size={size} className={className} />}</>
}

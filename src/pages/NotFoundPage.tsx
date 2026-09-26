import { Link } from "react-router-dom"
import { useAuthStore } from "@/stores/auth-store"
import { buttonVariants } from "@/components/ui/button"
import { postAuthDestination } from "@/lib/auth-utils"
import { t } from "@/lib/i18n"

export default function NotFoundPage() {
  const { profile, isLoading } = useAuthStore()

  const ctaTo = isLoading
    ? "/"
    : profile
      ? postAuthDestination(profile)
      : "/auth/login"

  const ctaLabel = isLoading ? t.not_found_go_home : profile ? t.not_found_go_dashboard : t.not_found_go_login

  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <div className="text-6xl font-semibold tracking-tight text-primary">{t.not_found_code}</div>
        <h1 className="mt-3 text-balance text-2xl font-semibold">{t.not_found_title}</h1>
        <p className="mt-2 text-pretty text-muted-foreground">
          {t.not_found_desc}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link to={ctaTo} className={buttonVariants({ className: "touch-target" })}>
            {ctaLabel}
          </Link>
        </div>
      </div>
    </div>
  )
}


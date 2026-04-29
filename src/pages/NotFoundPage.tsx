import { Link } from "react-router-dom"
import { useAuthStore } from "@/stores/auth-store"
import { buttonVariants } from "@/components/ui/button"
import { postAuthDestination } from "@/lib/auth-utils"

export default function NotFoundPage() {
  const { profile, isLoading } = useAuthStore()

  const ctaTo = isLoading
    ? "/"
    : profile
      ? postAuthDestination(profile)
      : "/auth/login"

  const ctaLabel = isLoading ? "Go home" : profile ? "Go to dashboard" : "Go to login"

  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <div className="text-6xl font-semibold tracking-tight text-primary">404</div>
        <h1 className="mt-3 text-balance text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-pretty text-muted-foreground">
          The page you’re looking for doesn’t exist or may have been moved.
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


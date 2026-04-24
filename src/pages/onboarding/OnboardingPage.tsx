import { Navigate } from "react-router-dom"
import { useAuthStore } from "@/stores/auth-store"
import { OnboardingForm } from "@/components/forms/OnboardingForm"
import { PageLoading } from "@/components/shared/LoadingSpinner"

export default function OnboardingPage() {
  const { profile, isLoading } = useAuthStore()

  if (isLoading) return <PageLoading />
  if (!profile) return <Navigate to="/auth/login" replace />
  if (profile.onboarding_completed) return <Navigate to="/dashboard" replace />

  return <OnboardingForm />
}

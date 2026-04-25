import { useEffect } from "react"
import { supabase } from "@/services/supabase"
import { getProfile } from "@/services/auth.service"
import { useAuthStore } from "@/stores/auth-store"
import type { Session } from "@supabase/supabase-js"

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timeoutId: number | undefined
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
  })

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId)
  })
}

export function useAuth() {
  const { profile, isLoading, setProfile, setLoading, reset } = useAuthStore()

  useEffect(() => {
    async function init() {
      try {
        const {
          data: { session },
        } = await withTimeout(supabase.auth.getSession(), 10_000, "supabase.auth.getSession")

        if (session?.user) {
          const p = await withTimeout(getProfile(session.user.id), 10_000, "getProfile")
          setProfile(p)
        } else {
          setLoading(false)
        }
      } catch {
        setLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: string, session: Session | null) => {
        if (session?.user) {
          try {
            const p = await withTimeout(getProfile(session.user.id), 10_000, "getProfile")
            setProfile(p)
          } catch {
            setLoading(false)
          }
        } else {
          reset()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [setProfile, setLoading, reset])

  return { profile, isLoading }
}

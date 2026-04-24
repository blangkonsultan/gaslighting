import { useEffect } from "react"
import { supabase } from "@/services/supabase"
import { getProfile } from "@/services/auth.service"
import { useAuthStore } from "@/stores/auth-store"
import type { Session } from "@supabase/supabase-js"

export function useAuth() {
  const { profile, isLoading, setProfile, setLoading, reset } = useAuthStore()

  useEffect(() => {
    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          const p = await getProfile(session.user.id)
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
            const p = await getProfile(session.user.id)
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

  return { user: supabase.auth.getUser(), profile, isLoading }
}

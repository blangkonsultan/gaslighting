import { useEffect, useRef } from "react"
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
  const initInFlightRef = useRef(false)
  const lastInitAtRef = useRef(0)

  useEffect(() => {
    async function init(reason: string) {
      if (initInFlightRef.current) return
      const now = Date.now()
      if (now - lastInitAtRef.current < 500) return

      initInFlightRef.current = true
      lastInitAtRef.current = now
      setLoading(true)

      // Hard-stop to avoid "infinite loading" on mobile tab restore/background edge cases.
      // If auth restoration hangs (storage lock, bfcache restore, etc.), we prefer a safe
      // unauthenticated state over a spinner that never resolves.
      const hardStopId = window.setTimeout(() => {
        reset()
      }, 12_000)

      try {
        const {
          data: { session },
        } = await withTimeout(supabase.auth.getSession(), 10_000, `supabase.auth.getSession (${reason})`)

        if (session?.user) {
          const p = await withTimeout(getProfile(session.user.id), 10_000, `getProfile (${reason})`)
          setProfile(p)
        } else {
          reset()
        }
      } catch {
        reset()
      } finally {
        window.clearTimeout(hardStopId)
        initInFlightRef.current = false
      }
    }

    void init("mount")

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: string, session: Session | null) => {
        if (session?.user) {
          try {
            const p = await withTimeout(getProfile(session.user.id), 10_000, "getProfile")
            setProfile(p)
          } catch {
            reset()
          }
        } else {
          // Supabase can emit a transient "no session" event during startup while storage
          // is still being restored. If we reset here, GuestRoute can briefly render the
          // login form before init() resolves, causing a visible flash.
          if (initInFlightRef.current) return
          reset()
        }
      }
    )

    function onVisibilityChange() {
      if (document.visibilityState === "visible" && useAuthStore.getState().isLoading) {
        void init("visibilitychange")
      }
    }

    function onPageShow(event: PageTransitionEvent) {
      // When restored from back/forward cache, pending timers/promises may be in a bad state.
      if (event.persisted && useAuthStore.getState().isLoading) {
        void init("pageshow(bfcache)")
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange)
    window.addEventListener("pageshow", onPageShow)

    return () => {
      subscription.unsubscribe()
      document.removeEventListener("visibilitychange", onVisibilityChange)
      window.removeEventListener("pageshow", onPageShow)
    }
  }, [setProfile, setLoading, reset])

  return { profile, isLoading }
}

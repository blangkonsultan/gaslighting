import { useEffect, useRef } from "react"
import { supabase } from "@/services/supabase"
import { getProfile } from "@/services/auth.service"
import { useAuthStore } from "@/stores/auth-store"
import type { Session } from "@supabase/supabase-js"

const NULL_SESSION_DEBOUNCE_MS = 400

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
  const { profile, isLoading, hydrated, setAuthenticated, setLoading, reset } = useAuthStore()
  const initInFlightRef = useRef(false)
  const lastInitAtRef = useRef(0)
  const receivedInitialSessionRef = useRef(false)
  const pendingNullSessionResetIdRef = useRef<number | null>(null)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        if (event === "INITIAL_SESSION") receivedInitialSessionRef.current = true

        if (session?.user) {
          if (pendingNullSessionResetIdRef.current !== null) {
            window.clearTimeout(pendingNullSessionResetIdRef.current)
            pendingNullSessionResetIdRef.current = null
          }

          const needsProfileFetch = event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "USER_UPDATED"

          if (needsProfileFetch) {
            // If we have a cached profile, use it immediately and revalidate in background.
            const state = useAuthStore.getState()
            if (state.hydrated && state.profile) {
              if (state.sessionUserId !== session.user.id) {
                setAuthenticated(session.user.id, state.profile)
              } else if (state.isLoading) {
                // Cached profile is present — clear the loading state.
                setLoading(false)
              }
              // Background revalidation to pick up any profile changes (e.g. role change by admin).
              withTimeout(getProfile(session.user.id), 10_000, "getProfile (bg)")
                .then((p) => setAuthenticated(session.user.id, p))
                .catch(() => {
                  // Silent — cached profile is still valid enough.
                })
            } else {
              setLoading(true)
              try {
                const p = await withTimeout(getProfile(session.user.id), 10_000, "getProfile")
                setAuthenticated(session.user.id, p)
              } catch {
                const state = useAuthStore.getState()
                if (state.profile === null && !initInFlightRef.current) reset()
              }
            }
          } else {
            const state = useAuthStore.getState()
            if (state.sessionUserId !== session.user.id || state.isLoading) {
              setAuthenticated(session.user.id, state.profile!)
            }
          }
        } else {
          if (event === "SIGNED_OUT") {
            reset()
            return
          }

          if (pendingNullSessionResetIdRef.current !== null) return
          setLoading(true)
          pendingNullSessionResetIdRef.current = window.setTimeout(() => {
            pendingNullSessionResetIdRef.current = null
            if (initInFlightRef.current) return
            const state = useAuthStore.getState()
            if (state.sessionUserId === null && state.profile === null) reset()
          }, NULL_SESSION_DEBOUNCE_MS)
        }
      }
    )

    async function init(reason: string) {
      if (initInFlightRef.current) return
      const now = Date.now()
      if (now - lastInitAtRef.current < 500) return

      initInFlightRef.current = true
      lastInitAtRef.current = now

      const hardStopId = window.setTimeout(() => {
        const state = useAuthStore.getState()
        if (state.profile === null) reset()
      }, 12_000)

      try {
        const {
          data: { session },
        } = await withTimeout(supabase.auth.getSession(), 10_000, `supabase.auth.getSession (${reason})`)

        if (session?.user) {
          // If we already have a cached profile, don't block — just revalidate in background.
          const state = useAuthStore.getState()
          if (state.hydrated && state.profile) {
            if (state.isLoading) setLoading(false)
            withTimeout(getProfile(session.user.id), 10_000, `getProfile (bg ${reason})`)
              .then((p) => setAuthenticated(session.user.id, p))
              .catch(() => {})
          } else {
            setLoading(true)
            const p = await withTimeout(getProfile(session.user.id), 10_000, `getProfile (${reason})`)
            setAuthenticated(session.user.id, p)
          }
        }
      } catch {
        const state = useAuthStore.getState()
        if (state.profile === null) reset()
      } finally {
        window.clearTimeout(hardStopId)
        initInFlightRef.current = false
      }
    }

    void init("mount")

    function onVisibilityChange() {
      if (document.visibilityState === "visible" && useAuthStore.getState().isLoading) {
        void init("visibilitychange")
      }
    }

    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted && useAuthStore.getState().isLoading) {
        void init("pageshow(bfcache)")
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange)
    window.addEventListener("pageshow", onPageShow)

    return () => {
      subscription.unsubscribe()
      if (pendingNullSessionResetIdRef.current !== null) {
        window.clearTimeout(pendingNullSessionResetIdRef.current)
        pendingNullSessionResetIdRef.current = null
      }
      document.removeEventListener("visibilitychange", onVisibilityChange)
      window.removeEventListener("pageshow", onPageShow)
    }
  }, [setAuthenticated, setLoading, reset])

  return { profile, isLoading }
}

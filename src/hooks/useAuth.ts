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
  const { profile, isLoading, setSessionUserId, setProfile, setLoading, reset } = useAuthStore()
  const initInFlightRef = useRef(false)
  const lastInitAtRef = useRef(0)
  const receivedInitialSessionRef = useRef(false)
  const pendingNullSessionResetIdRef = useRef<number | null>(null)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        // Any auth event implies Supabase has finished its initial storage/session reconciliation.
        // We treat this as a signal that it's safe to resolve to "logged out" if session is null.
        if (event === "INITIAL_SESSION") receivedInitialSessionRef.current = true

        if (session?.user) {
          if (pendingNullSessionResetIdRef.current !== null) {
            window.clearTimeout(pendingNullSessionResetIdRef.current)
            pendingNullSessionResetIdRef.current = null
          }
          setSessionUserId(session.user.id)
          try {
            const p = await withTimeout(getProfile(session.user.id), 10_000, "getProfile")
            setProfile(p)
          } catch {
            reset()
          }
        } else {
          // Supabase can emit a transient "no session" event during startup while storage
          // is still being restored. If we reset here while init() is in flight, GuestRoute
          // can briefly render the login form before init() resolves, causing a visible flash.
          // If this is a real sign-out, apply immediately.
          if (event === "SIGNED_OUT") {
            reset()
            return
          }

          // Otherwise (commonly: INITIAL_SESSION=null then SIGNED_IN shortly after),
          // debounce the reset to avoid a brief redirect-to-login flash.
          if (pendingNullSessionResetIdRef.current !== null) return
          setLoading(true)
          pendingNullSessionResetIdRef.current = window.setTimeout(() => {
            pendingNullSessionResetIdRef.current = null
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
          setSessionUserId(session.user.id)
          const p = await withTimeout(getProfile(session.user.id), 10_000, `getProfile (${reason})`)
          setProfile(p)
        } else {
          // `getSession()` can transiently return null while storage is still restoring during a refresh.
          // Never resolve to unauthenticated from this alone; wait for Supabase auth events to settle.
          // If the user is truly logged out, onAuthStateChange will emit a null session and we'll
          // resolve via the debounced null-session handler above.
        }
      } catch {
        reset()
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
      // When restored from back/forward cache, pending timers/promises may be in a bad state.
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
  }, [setSessionUserId, setProfile, setLoading, reset])

  return { profile, isLoading }
}

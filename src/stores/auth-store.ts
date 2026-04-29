import { create } from "zustand"
import type { Profile } from "@/types/financial"

const PROFILE_STORAGE_KEY = "gaslighting:cached-profile"

function readCachedProfile(): { userId: string; profile: Profile } | null {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.userId && parsed?.profile) return parsed
    return null
  } catch {
    return null
  }
}

function writeCachedProfile(userId: string, profile: Profile) {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ userId, profile }))
  } catch {
    // storage full or unavailable — non-critical
  }
}

function clearCachedProfile() {
  try {
    localStorage.removeItem(PROFILE_STORAGE_KEY)
  } catch {
    // ignore
  }
}

interface AuthState {
  sessionUserId: string | null
  profile: Profile | null
  isLoading: boolean
  hydrated: boolean
  setSessionUserId: (id: string | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  reset: () => void
  setAuthenticated: (userId: string, profile: Profile) => void
}

const cached = readCachedProfile()

export const useAuthStore = create<AuthState>((set) => ({
  sessionUserId: cached?.userId ?? null,
  profile: cached?.profile ?? null,
  isLoading: !cached,
  hydrated: !!cached,
  setSessionUserId: (sessionUserId) => set({ sessionUserId }),
  setProfile: (profile) => set({ profile, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => {
    clearCachedProfile()
    set({ sessionUserId: null, profile: null, isLoading: false, hydrated: true })
  },
  setAuthenticated: (userId, profile) => {
    writeCachedProfile(userId, profile)
    set({ sessionUserId: userId, profile, isLoading: false, hydrated: true })
  },
}))

import { create } from "zustand"
import type { Profile } from "@/types/financial"

interface AuthState {
  sessionUserId: string | null
  profile: Profile | null
  isLoading: boolean
  setSessionUserId: (id: string | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  sessionUserId: null,
  profile: null,
  isLoading: true,
  setSessionUserId: (sessionUserId) => set({ sessionUserId }),
  setProfile: (profile) => set({ profile, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ sessionUserId: null, profile: null, isLoading: false }),
}))

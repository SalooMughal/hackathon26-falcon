import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthTokens, AuthUser } from '../api/auth'
import { signout as signoutRequest } from '../api/auth'

type AuthState = {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  setSession: (tokens: AuthTokens, user: AuthUser) => void
  clearSession: () => void
  signOut: () => Promise<void>
}

const ACCESS_KEY = 'falconai_access_token'
const REFRESH_KEY = 'falconai_refresh_token'

function syncTokenStorage(accessToken: string | null, refreshToken: string | null) {
  if (accessToken) {
    localStorage.setItem(ACCESS_KEY, accessToken)
  } else {
    localStorage.removeItem(ACCESS_KEY)
  }

  if (refreshToken) {
    localStorage.setItem(REFRESH_KEY, refreshToken)
  } else {
    localStorage.removeItem(REFRESH_KEY)
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      setSession: (tokens, user) => {
        syncTokenStorage(tokens.access_token, tokens.refresh_token)
        set({
          user,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
        })
      },

      clearSession: () => {
        syncTokenStorage(null, null)
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
        })
      },

      signOut: async () => {
        try {
          if (get().accessToken) {
            await signoutRequest()
          }
        } finally {
          get().clearSession()
        }
      },
    }),
    {
      name: 'falconai-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken || state?.refreshToken) {
          syncTokenStorage(state.accessToken, state.refreshToken)
        }
      },
    },
  ),
)

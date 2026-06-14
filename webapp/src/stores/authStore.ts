import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  token: string | null
  refreshToken: string | null
  username: string | null
  isAuthenticated: boolean
  login: (accessToken: string, refreshToken: string, username: string) => void
  logout: () => void
  setAccessToken: (token: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      username: null,
      isAuthenticated: false,
      login: (accessToken, refreshToken, username) =>
        set({ token: accessToken, refreshToken, username, isAuthenticated: true }),
      logout: () =>
        set({ token: null, refreshToken: null, username: null, isAuthenticated: false }),
      setAccessToken: (token) => set({ token }),
    }),
    {
      name: 'codesail-auth',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        username: state.username,
      }),
    },
  ),
)

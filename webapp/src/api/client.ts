import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'
import type { BackendEnvelope } from '@/types/api'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Track concurrent token refresh to avoid race conditions
let refreshPromise: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  const { refreshToken } = useAuthStore.getState()
  if (!refreshToken) throw new Error('No refresh token')

  const res = await axios.post<BackendEnvelope<{ access_token: string; token_type: string; expires_in: number }>>(
    `${apiClient.defaults.baseURL}/admin/refresh`,
    { refresh_token: refreshToken },
    { headers: { 'Content-Type': 'application/json' } },
  )

  if (res.data.code !== 0) {
    throw new Error(res.data.message || 'Token refresh failed')
  }

  const newToken = res.data.data.access_token
  useAuthStore.getState().setAccessToken(newToken)
  return newToken
}

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => {
    const body = response.data
    // Unwrap standard backend envelope { code, data, message, meta }
    if (body && typeof body.code !== 'undefined') {
      if (body.code !== 0) {
        const err = new Error(body.message || '请求失败')
        ;(err as unknown as Record<string, unknown>).code = body.code
        return Promise.reject(err)
      }
      // Return envelope so callers can access .data and .meta
      return body
    }
    return body
  },
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      const originalRequest = error.config

      // Only attempt refresh for admin (non-login) endpoints
      const isLoginRequest = originalRequest.url?.includes('/admin/login')
      const isRefreshRequest = originalRequest.url?.includes('/admin/refresh')

      if (!isLoginRequest && !isRefreshRequest) {
        originalRequest._retry = true

        try {
          if (!refreshPromise) {
            refreshPromise = refreshAccessToken()
          }
          const newToken = await refreshPromise
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return apiClient(originalRequest)
        } catch {
          useAuthStore.getState().logout()
          window.location.href = '/login'
          return Promise.reject(new Error('登录已过期，请重新登录'))
        } finally {
          refreshPromise = null
        }
      }

      // If refresh itself fails or it's a login request, just logout
      useAuthStore.getState().logout()
      window.location.href = '/login'
      return Promise.reject(new Error('登录已过期，请重新登录'))
    }

    const message = error.response?.data?.message || error.message || '请求失败'
    return Promise.reject(new Error(message))
  },
)

export default apiClient

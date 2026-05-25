import apiClient from './client'

interface LoginResponse {
  token: string
  username: string
}

interface ChangePasswordParams {
  oldPassword: string
  newPassword: string
}

const isMock = import.meta.env.DEV || import.meta.env.VITE_USE_MOCK === 'true'

export const authApi = {
  async login(params: { username: string; password: string }): Promise<LoginResponse> {
    if (isMock) {
      await new Promise((r) => setTimeout(r, 800))
      if (params.username === 'admin' && params.password === 'admin123') {
        return { token: 'mock-token-codesail-' + Date.now(), username: params.username }
      }
      throw new Error('用户名或密码错误')
    }
    return apiClient.post('/auth/login', params) as Promise<LoginResponse>
  },

  changePassword(params: ChangePasswordParams) {
    if (isMock) {
      return Promise.resolve()
    }
    return apiClient.post('/auth/change-password', params) as Promise<void>
  },
}

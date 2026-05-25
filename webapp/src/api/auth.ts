import apiClient from './client'

interface LoginResponse {
  token: string
  username: string
}

interface ChangePasswordParams {
  oldPassword: string
  newPassword: string
}

export const authApi = {
  login(params: { username: string; password: string }) {
    return apiClient.post('/auth/login', params) as Promise<LoginResponse>
  },

  changePassword(params: ChangePasswordParams) {
    return apiClient.post('/auth/change-password', params) as Promise<void>
  },
}

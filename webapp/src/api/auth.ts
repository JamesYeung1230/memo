import apiClient from './client'

interface LoginResponse {
  token: string
  refreshToken: string
  username: string
}

interface ChangePasswordParams {
  oldPassword: string
  newPassword: string
}

interface BackendLoginData {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export const authApi = {
  /**
   * Admin login — POST /api/v1/admin/login
   * Maps backend { access_token, refresh_token } → { token, refreshToken, username }
   */
  async login(params: { username: string; password: string }): Promise<LoginResponse> {
    const res = await apiClient.post('/admin/login', params)
    const data = res.data as BackendLoginData
    return {
      token: data.access_token,
      refreshToken: data.refresh_token,
      username: params.username,
    }
  },

  /**
   * Admin password change — PUT /api/v1/admin/password
   */
  async changePassword(params: ChangePasswordParams): Promise<void> {
    await apiClient.put('/admin/password', {
      old_password: params.oldPassword,
      new_password: params.newPassword,
    })
  },
}

App({
  globalData: {
    token: null,
    refreshToken: null,
    userInfo: null,
    isLoggedIn: false,
    themeColor: '#4A90D9',
    themeColorLight: '#7AB8F5',
    themeColorDark: '#2D6EC9'
  },

  onLaunch() {
    this.checkLoginStatus()
    this.fetchThemeConfig()
  },

  /**
   * 检查本地登录态
   * 有 token 则标记已登录（不做服务端校验，401 由 request.js 兜底）
   */
  checkLoginStatus() {
    var token = wx.getStorageSync('token')
    var refreshToken = wx.getStorageSync('refreshToken')
    if (token) {
      this.globalData.token = token
      this.globalData.refreshToken = refreshToken || null
      this.globalData.isLoggedIn = true
      var userInfo = wx.getStorageSync('userInfo')
      if (userInfo) {
        this.globalData.userInfo = userInfo
      }
    }
  },

  fetchThemeConfig() {
    var cachedTheme = wx.getStorageSync('themeColor')
    if (cachedTheme) {
      this.applyTheme(cachedTheme)
    }
  },

  applyTheme(primaryColor) {
    this.globalData.themeColor = primaryColor
    this.globalData.themeColorLight = this.adjustColor(primaryColor, 15)
    this.globalData.themeColorDark = this.adjustColor(primaryColor, -15)
    wx.setStorageSync('themeColor', primaryColor)
  },

  adjustColor(hex, percent) {
    var num = parseInt(hex.replace('#', ''), 16)
    var r = Math.min(255, Math.max(0, (num >> 16) + percent))
    var g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + percent))
    var b = Math.min(255, Math.max(0, (num & 0x0000FF) + percent))
    return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1)
  },

  /**
   * 保存 access_token 到本地和 globalData
   * @param {string} token        - access_token
   * @param {string} refreshToken - refresh_token（可选）
   */
  setToken(token, refreshToken) {
    this.globalData.token = token
    this.globalData.isLoggedIn = true
    wx.setStorageSync('token', token)
    if (refreshToken) {
      this.globalData.refreshToken = refreshToken
      wx.setStorageSync('refreshToken', refreshToken)
    }
  },

  setUserInfo(userInfo) {
    this.globalData.userInfo = userInfo
    wx.setStorageSync('userInfo', userInfo)
  },

  logout() {
    this.globalData.token = null
    this.globalData.refreshToken = null
    this.globalData.userInfo = null
    this.globalData.isLoggedIn = false
    wx.removeStorageSync('token')
    wx.removeStorageSync('refreshToken')
    wx.removeStorageSync('userInfo')
    wx.reLaunch({ url: '/pages/login/login' })
  },

  /**
   * 获取请求头（供不使用 request.js 的场景复用）
   */
  getRequestHeader() {
    return {
      'Authorization': 'Bearer ' + this.globalData.token,
      'Content-Type': 'application/json'
    }
  }
})

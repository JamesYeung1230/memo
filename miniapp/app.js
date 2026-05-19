App({
  globalData: {
    token: null,
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

  checkLoginStatus() {
    const token = wx.getStorageSync('token')
    if (token) {
      this.globalData.token = token
      this.globalData.isLoggedIn = true
      const userInfo = wx.getStorageSync('userInfo')
      if (userInfo) {
        this.globalData.userInfo = userInfo
      }
    }
  },

  fetchThemeConfig() {
    const cachedTheme = wx.getStorageSync('themeColor')
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
    const num = parseInt(hex.replace('#', ''), 16)
    const r = Math.min(255, Math.max(0, (num >> 16) + percent))
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + percent))
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + percent))
    return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1)
  },

  setToken(token) {
    this.globalData.token = token
    this.globalData.isLoggedIn = true
    wx.setStorageSync('token', token)
  },

  setUserInfo(userInfo) {
    this.globalData.userInfo = userInfo
    wx.setStorageSync('userInfo', userInfo)
  },

  logout() {
    this.globalData.token = null
    this.globalData.userInfo = null
    this.globalData.isLoggedIn = false
    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
    wx.reLaunch({ url: '/pages/login/login' })
  },

  getRequestHeader() {
    return {
      'Authorization': 'Bearer ' + this.globalData.token,
      'Content-Type': 'application/json'
    }
  }
})

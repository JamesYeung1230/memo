var authApi = require('../../api/auth')

Page({
  data: {
    isLogging: false
  },

  onLoad() {},

  onShow() {
    // 如果已登录，直接跳转首页
    var app = getApp()
    if (app.globalData.isLoggedIn) {
      wx.reLaunch({ url: '/pages/home/home' })
    }
  },

  handleLogin() {
    var self = this

    if (self.data.isLogging) return

    self.setData({ isLogging: true })
    wx.showLoading({ title: '登录中...', mask: true })

    // 1. 调用微信登录获取 code
    wx.login({
      success: function (loginRes) {
        if (!loginRes.code) {
          wx.hideLoading()
          wx.showToast({ title: '获取登录凭证失败', icon: 'none' })
          self.setData({ isLogging: false })
          return
        }

        // 2. 用 code 换取后端 JWT
        authApi.wechatLogin(loginRes.code).then(function () {
          wx.hideLoading()

          var app = getApp()
          // 同步登录态到 app globalData
          app.globalData.token = wx.getStorageSync('token')
          app.globalData.refreshToken = wx.getStorageSync('refreshToken')
          app.globalData.isLoggedIn = true

          wx.showToast({ title: '登录成功', icon: 'success', duration: 1000 })
          setTimeout(function () {
            wx.reLaunch({ url: '/pages/home/home' })
          }, 1000)
        }).catch(function (err) {
          wx.hideLoading()
          self.setData({ isLogging: false })
          console.error('登录失败:', err)
          wx.showToast({
            title: err.message || '登录失败，请重试',
            icon: 'none',
            duration: 2000
          })
        })
      },
      fail: function () {
        wx.hideLoading()
        self.setData({ isLogging: false })
        wx.showToast({ title: '微信登录失败', icon: 'none' })
      }
    })
  }
})
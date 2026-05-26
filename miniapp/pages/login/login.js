var authApi = require('../../api/auth')

Page({
  data: {
    isLogging: false,
    privacyAgreed: false
  },

  onLoad() {},

  onShow() {
    // 如果已登录，直接跳转首页
    var app = getApp()
    if (app.globalData.isLoggedIn) {
      wx.reLaunch({ url: '/pages/home/home' })
    }
  },

  togglePrivacyAgreed() {
    this.setData({ privacyAgreed: !this.data.privacyAgreed })
  },

  onPrivacyTap() {
    wx.showModal({
      title: '隐私政策',
      content: '本应用（"码上启航"）重视您的隐私。我们仅收集您的微信昵称和头像用于展示个人资料，以及您的学习记录（答题、笔记、积分等）用于提供学习服务。我们不会将您的个人信息用于任何其他目的或分享给第三方。详细内容请访问我们的官方网站。',
      showCancel: false,
    })
  },

  onAgreementTap() {
    wx.showModal({
      title: '用户服务协议',
      content: '欢迎使用码上启航。本应用提供编程知识学习、答题练习、记忆强化等学习服务。用户应遵守相关法律法规，不得利用本应用从事违法违规活动。我们保留更新本协议条款的权利。继续使用即表示您接受更新后的条款。',
      showCancel: false,
    })
  },

  onGuestEntry() {
    wx.reLaunch({ url: '/pages/home/home' })
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
Page({
  data: {},

  onLoad() {},

  onShow() {},

  handleLogin() {
    wx.showLoading({ title: '登录中...' })
    setTimeout(() => {
      const app = getApp()
      app.setToken('mock_token_' + Date.now())
      app.setUserInfo({
        nickName: '开发者',
        avatarUrl: '',
        mockCode: 'mock_code_' + Date.now()
      })
      wx.hideLoading()
      wx.reLaunch({ url: '/pages/home/home' })
    }, 800)
  }
})
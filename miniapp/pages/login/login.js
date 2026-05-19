Page({
  data: {},

  onLoad() {},

  onShow() {},

  handleLogin() {
    wx.showLoading({ title: '登录中...' })
    wx.login({
      success: (res) => {
        if (res.code) {
          const app = getApp()
          app.setToken('mock_token')
          app.setUserInfo({ nickName: '用户' })
          wx.hideLoading()
          wx.reLaunch({ url: '/pages/home/home' })
        } else {
          wx.hideLoading()
          wx.showToast({ title: '登录失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '登录失败', icon: 'none' })
      }
    })
  }
})
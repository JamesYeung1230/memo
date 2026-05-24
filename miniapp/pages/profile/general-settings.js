var app = getApp()

Page({
  data: {
    _pageEnter: true,
    currentTheme: '#4A90D9',
    themeColors: [
      { value: '#4A90D9', label: '默认蓝', desc: '沉稳专业' },
      { value: '#6C5CE7', label: '优雅紫', desc: '创意灵动' },
      { value: '#00B894', label: '清新绿', desc: '自然护眼' },
      { value: '#FDCB6E', label: '温暖橙', desc: '活力热情' },
      { value: '#E17055', label: '珊瑚红', desc: '热情奔放' },
      { value: '#0984E3', label: '深海蓝', desc: '冷静专注' }
    ],
    cacheSize: '计算中...',
    appVersion: '1.0.0'
  },

  onLoad() {
    var cachedTheme = wx.getStorageSync('themeColor') || '#4A90D9'
    this.setData({ currentTheme: cachedTheme })
    this.calculateCacheSize()
  },

  onShow() {
    if (this._hasShown) {
      this.setData({ _pageEnter: false }, function () {
        this.setData({ _pageEnter: true })
      })
    } else {
      this._hasShown = true
    }
  },

  calculateCacheSize() {
    try {
      var storageInfo = wx.getStorageInfoSync()
      var currentSize = storageInfo.currentSize || 0
      var sizeText = currentSize > 1024
        ? (currentSize / 1024).toFixed(1) + 'MB'
        : currentSize + 'KB'
      this.setData({ cacheSize: sizeText })
    } catch (e) {
      this.setData({ cacheSize: '0KB' })
    }
  },

  onThemeSelect(e) {
    var color = e.currentTarget.dataset.color
    this.setData({ currentTheme: color })
    app.applyTheme(color)
    wx.showToast({ title: '主题已切换', icon: 'success' })
  },

  onClearCache() {
    var that = this
    wx.showModal({
      title: '确认清除',
      content: '将清除本地缓存数据，包括缓存的知识卡片等。确定清除？',
      success: function (res) {
        if (res.confirm) {
          wx.clearStorageSync()
          wx.showToast({ title: '缓存已清除', icon: 'success' })
          that.setData({ cacheSize: '0KB' })
        }
      }
    })
  },

  onAbout() {
    wx.showModal({
      title: '关于',
      content: 'CodeSail v' + this.data.appVersion + '\n高效编程知识学习平台',
      showCancel: false
    })
  },

  onLogout() {
    var that = this
    wx.showModal({
      title: '确认退出',
      content: '确定退出当前账号？',
      success: function (res) {
        if (res.confirm) {
          app.logout()
        }
      }
    })
  }
})

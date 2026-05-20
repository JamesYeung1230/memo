Page({
  data: {
    _pageEnter: true
  },

  onLoad() {},

  onShow() {
    if (this._hasShown) {
      this.setData({ _pageEnter: false }, function () {
        this.setData({ _pageEnter: true })
      })
    } else {
      this._hasShown = true
    }
  },

  onUserTap() {
    wx.showToast({ title: '个人资料', icon: 'none' })
  },

  onMenuTap(e) {
    const page = e.currentTarget.dataset.page
    const paths = {
      'study-stats': '/pages/profile/study-stats',
      'favorites': '/pages/profile/favorites',
      'achievements': '/pages/points/achievements',
      'audit-history': '/pages/profile/audit-history'
    }
    const url = paths[page]
    if (url) {
      wx.navigateTo({ url })
    }
  }
})

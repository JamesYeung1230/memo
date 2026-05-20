Page({
  data: {
    _pageEnter: true,
    domainTags: [
      { name: 'K01 编程基础' },
      { name: 'K02 网络基础' },
      { name: 'K03 软件工程' },
      { name: 'K04 数据库' }
    ],
    activeTagIndex: 0,
    statusBarHeight: 0
  },

  onLoad() {
    const { statusBarHeight } = wx.getSystemInfoSync()
    this.setData({ statusBarHeight })
  },

  onTagTap(e) {
    const { index } = e.currentTarget.dataset
    this.setData({ activeTagIndex: index })
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

  onCardLearnTap() {
    wx.navigateTo({ url: '/pages/learn/card-browse/card-browse' })
  },

  onQuizTap() {
    wx.navigateTo({ url: '/pages/learn/error-book/error-book' })
  },

  onReviewTodayTap() {
    wx.navigateTo({ url: '/pages/learn/review-today/review-today' })
  },

  onErrorReviewTap() {
    wx.navigateTo({ url: '/pages/learn/error-review/error-review' })
  },

  onReviewSettingsTap() {
    wx.navigateTo({ url: '/pages/learn/review-settings/review-settings' })
  }
})

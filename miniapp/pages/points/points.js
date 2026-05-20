Page({
  data: {
    _pageEnter: true,
    navTitle: '积分与成就',
    pointsAmount: '168',
    pointsHint: '可解锁 3 个知识领域',
    adIcon: '🎬',
    adText: '看广告赚积分 +10/次',
    adBtnText: '观看',
    storeLabel: '知识解锁商店',
    storeList: [
      { icon: '🗄️', name: 'K04 数据库', price: '40 积分', unlocked: true },
      { icon: '💻', name: 'K05 操作系统', price: '50 积分🔒', unlocked: false }
    ],
    achLabel: '成就徽章 (3/8)',
    achList: [
      { icon: '🏅', name: '初识编程', iconStyle: '', nameStyle: '' },
      { icon: '🔥', name: '连续7天', iconStyle: '', nameStyle: '' },
      { icon: '⭐', name: '积分达人', iconStyle: 'color: var(--color-text-hint);', nameStyle: 'color: var(--color-text-hint);' }
    ]
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

  onWatchAd() {},

  onStoreTap(e) {
    const index = e.currentTarget.dataset.index
    const item = this.data.storeList[index]
    if (!item.unlocked) {
      wx.navigateTo({ url: '/pages/points/unlock-confirm/unlock-confirm' })
    }
  }
})

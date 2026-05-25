var pointsApi = require('../../api/points')

Page({
  data: {
    _pageEnter: true,
    navTitle: '积分与成就',
    pointsAmount: '--',
    pointsHint: '加载中...',
    adIcon: '🎬',
    adText: '看广告赚积分 +10/次',
    adBtnText: '观看',
    storeLabel: '知识解锁商店',
    storeList: [],
    achLabel: '成就徽章',
    achList: []
  },

  onLoad() {
    this.loadPageData()
  },

  onShow() {
    if (this._hasShown) {
      this.setData({ _pageEnter: false }, function () {
        this.setData({ _pageEnter: true })
      })
      this.loadPageData()
    } else {
      this._hasShown = true
    }
  },

  loadPageData() {
    this.fetchBalance()
    this.fetchAchievements()
    this.fetchConfig()
  },

  fetchBalance() {
    var that = this
    pointsApi.getBalance().then(function (res) {
      var balance = res.data && res.data.balance
      if (balance !== undefined && balance !== null) {
        that.setData({
          pointsAmount: String(balance),
          pointsHint: '继续学习赚取更多积分'
        })
      }
    }).catch(function () {})
  },

  fetchAchievements() {
    var that = this
    pointsApi.getAchievements().then(function (res) {
      var badges = res.data || []
      var activeBadges = badges.filter(function (item) {
        return item.status === 'published'
      })
      var preview = activeBadges.slice(0, 3).map(function (item) {
        var unlocked = item.points_required === null
        return {
          icon: item.icon_url || '🏅',
          name: item.name || '未知徽章',
          iconStyle: unlocked ? '' : 'color: var(--color-text-hint);',
          nameStyle: unlocked ? '' : 'color: var(--color-text-hint);'
        }
      })
      that.setData({
        achLabel: '成就徽章 (' + activeBadges.length + ')',
        achList: preview
      })
    }).catch(function () {
      that.setData({
        achLabel: '成就徽章',
        achList: []
      })
    })
  },

  fetchConfig() {
    var that = this
    pointsApi.getConfig().then(function (res) {
      var config = res.data || {}
      var configValue = config.config_value || {}
      var unlockList = configValue.unlock_list || configValue.domains || []
      var preview = unlockList.slice(0, 2).map(function (item) {
        var unlocked = item.unlocked === true
        return {
          icon: item.icon || '🗄️',
          name: item.name || '知识领域',
          price: unlocked ? '已解锁' : (item.points_cost || '?') + ' 积分',
          unlocked: unlocked
        }
      })
      that.setData({
        storeLabel: '知识解锁商店',
        storeList: preview
      })
    }).catch(function () {
      that.setData({
        storeList: []
      })
    })
  },

  onWatchAd() {
    var that = this
    wx.showLoading({ title: '加载广告...', mask: true })
    pointsApi.adWatch().then(function (res) {
      wx.hideLoading()
      var data = res.data || {}
      var added = data.points_added || 0
      var balance = data.balance_after || 0
      var dailyTotal = data.daily_total || 0
      var dailyLimit = data.daily_limit || 100

      that.setData({
        pointsAmount: String(balance)
      })

      wx.showToast({
        title: '+' + added + ' 积分 (' + dailyTotal + '/' + dailyLimit + ')',
        icon: 'success',
        duration: 2000
      })
    }).catch(function (err) {
      wx.hideLoading()
      var message = (err && (err.message || err.detail)) || '观看失败，请重试'
      wx.showToast({
        title: message,
        icon: 'none',
        duration: 2000
      })
    })
  },

  onStoreTap(e) {
    var index = e.currentTarget.dataset.index
    var item = this.data.storeList[index]
    if (item && !item.unlocked) {
      wx.navigateTo({
        url: '/pages/points/unlock-shop/unlock-shop'
      })
    }
  },

  onAchievementsTap() {
    wx.navigateTo({
      url: '/pages/points/achievements/achievements'
    })
  }
})

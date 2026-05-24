var pointsApi = require('../../api/points')

Page({
  data: {
    _loading: true,
    unlockList: [],
    userBalance: 0
  },

  onLoad() {
    this.loadData()
  },

  onShow() {},

  loadData() {
    var that = this
    this.setData({ _loading: true })

    Promise.all([
      pointsApi.getConfig(),
      pointsApi.getBalance()
    ]).then(function (results) {
      var configRes = results[0]
      var balanceRes = results[1]

      var config = configRes.data || {}
      var configValue = config.config_value || {}
      var unlockList = configValue.unlock_list || configValue.domains || []
      var balance = (balanceRes.data && balanceRes.data.balance) || 0

      var formatted = unlockList.map(function (item) {
        var cost = item.points_cost || item.unlock_points || 0
        var canUnlock = balance >= cost
        var unlocked = item.unlocked === true
        return {
          id: item.id || item.domain_id || '',
          name: item.name || '知识领域',
          description: item.description || '',
          icon: item.icon || '🗄️',
          pointsCost: cost,
          unlocked: unlocked,
          canUnlock: !unlocked && canUnlock
        }
      })

      that.setData({
        unlockList: formatted,
        userBalance: balance,
        _loading: false
      })
    }).catch(function () {
      that.setData({ _loading: false })
    })
  },

  onUnlockTap(e) {
    var index = e.currentTarget.dataset.index
    var item = this.data.unlockList[index]
    if (item && item.canUnlock) {
      wx.navigateTo({
        url: '/pages/points/unlock-confirm?domain_id=' + item.id + '&name=' + encodeURIComponent(item.name) + '&points_cost=' + item.pointsCost
      })
    }
  }
})

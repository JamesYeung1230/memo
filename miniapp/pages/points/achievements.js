var pointsApi = require('../../api/points')

Page({
  data: {
    _loading: true,
    badges: [],
    userBalance: 0
  },

  onLoad() {
    this.loadData()
  },

  onShow() {},

  loadData() {
    var that = this
    this.setData({ _loading: true })

    // 并发获取成就列表和用户积分余额
    Promise.all([
      pointsApi.getAchievements(),
      pointsApi.getBalance()
    ]).then(function (results) {
      var achievementsRes = results[0]
      var balanceRes = results[1]

      var badges = achievementsRes.data || []
      var balance = (balanceRes.data && balanceRes.data.balance) || 0

      var formatted = badges.map(function (item) {
        var unlocked = item.points_required === null || balance >= (item.points_required || 0)
        return {
          id: item.id,
          name: item.name || '未知徽章',
          description: item.description || '',
          iconUrl: item.icon_url || '🏅',
          pointsRequired: item.points_required,
          unlocked: unlocked,
          status: item.status || 'draft',
          createdAt: item.created_at || ''
        }
      })

      that.setData({
        badges: formatted,
        userBalance: balance,
        _loading: false
      })
    }).catch(function () {
      that.setData({ _loading: false })
    })
  },

  onBadgeTap(e) {
    var index = e.currentTarget.dataset.index
    var badge = this.data.badges[index]
    if (badge) {
      wx.navigateTo({
        url: '/pages/points/achievement-detail?id=' + badge.id
      })
    }
  }
})

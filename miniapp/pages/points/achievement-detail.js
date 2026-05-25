var pointsApi = require('../../api/points')

Page({
  data: {
    _loading: true,
    badgeId: '',
    badge: null
  },

  onLoad(options) {
    var id = options && options.id
    if (id) {
      this.setData({ badgeId: id })
      this.loadBadgeDetail(id)
    } else {
      this.setData({ _loading: false })
      wx.showToast({ title: '参数错误', icon: 'none' })
    }
  },

  onShow() {},

  loadBadgeDetail(id) {
    var that = this
    this.setData({ _loading: true })

    Promise.all([
      pointsApi.getAchievements(),
      pointsApi.getBalance()
    ]).then(function (results) {
      var badges = (results[0] && results[0].data) || []
      var balance = (results[1].data && results[1].data.balance) || 0

      var badge = null
      for (var i = 0; i < badges.length; i++) {
        if (badges[i].id === id) {
          badge = badges[i]
          break
        }
      }

      if (badge) {
        var unlocked = badge.points_required === null || balance >= (badge.points_required || 0)
        that.setData({
          badge: {
            id: badge.id,
            name: badge.name || '未知徽章',
            description: badge.description || '',
            iconUrl: badge.icon_url || '🏅',
            pointsRequired: badge.points_required,
            unlocked: unlocked,
            status: badge.status || 'draft',
            createdAt: badge.created_at || ''
          },
          _loading: false
        })
      } else {
        that.setData({ _loading: false })
      }
    }).catch(function () {
      that.setData({ _loading: false })
    })
  }
})

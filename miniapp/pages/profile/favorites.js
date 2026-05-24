var learnApi = require('../../api/learn')

Page({
  data: {
    _loading: true,
    favorites: [],
    totalCount: 0,
    currentPage: 1
  },

  onLoad() {
    this.fetchFavorites()
  },

  onShow() {
    if (this._hasShown) {
      this.fetchFavorites()
    } else {
      this._hasShown = true
    }
  },

  fetchFavorites() {
    var that = this
    this.setData({ _loading: true })

    learnApi.getFavorites().then(function (res) {
      var data = res.data || []
      var favorites = Array.isArray(data) ? data : (data.list || data.cards || [])
      var totalCount = data.total || data.count || favorites.length

      // 获取每项收藏卡片的标题
      var detailPromises = favorites.map(function (item) {
        // 先格式化时间
        item.displayTime = that.formatTime(item.created_at)
        return learnApi.getCardDetail(item.card_id).then(function (detailRes) {
          var cardData = detailRes.data || detailRes
          item.cardTitle = cardData.title || cardData.concept || cardData.core_concept || ('卡片 #' + item.card_id)
          return item
        }).catch(function () {
          // getCardDetail 失败时回退显示 card_id
          item.cardTitle = '卡片 #' + item.card_id
          return item
        })
      })

      return Promise.all(detailPromises).then(function (favoritesWithTitle) {
        that.setData({
          favorites: favoritesWithTitle,
          totalCount: totalCount,
          _loading: false
        })
      })
    }).catch(function () {
      that.setData({ _loading: false })
    })
  },

  onCardTap(e) {
    var cardId = e.currentTarget.dataset.cardId
    if (cardId) {
      wx.navigateTo({
        url: '/pages/learn/card-detail?card_id=' + cardId
      })
    }
  },

  onRemoveFavorite(e) {
    var cardId = e.currentTarget.dataset.cardId
    var that = this

    wx.showModal({
      title: '确认取消收藏',
      content: '确定取消收藏该卡片？',
      success: function (res) {
        if (res.confirm) {
          learnApi.favoriteCard(cardId).then(function () {
            wx.showToast({ title: '已取消收藏', icon: 'success' })
            that.fetchFavorites()
          }).catch(function () {
            wx.showToast({ title: '操作失败', icon: 'none' })
          })
        }
      }
    })
  },

  onRefresh() {
    this.fetchFavorites()
  },

  formatTime(timeStr) {
    if (!timeStr) return ''
    try {
      var iso = timeStr.replace(' ', 'T')
      var date = new Date(iso)
      if (isNaN(date.getTime())) {
        date = new Date(timeStr)
      }
      if (isNaN(date.getTime())) return timeStr
      var y = date.getFullYear()
      var m = (date.getMonth() + 1).toString().padStart(2, '0')
      var d = date.getDate().toString().padStart(2, '0')
      var h = date.getHours().toString().padStart(2, '0')
      var min = date.getMinutes().toString().padStart(2, '0')
      return y + '-' + m + '-' + d + ' ' + h + ':' + min
    } catch (e) {
      return timeStr
    }
  }
})

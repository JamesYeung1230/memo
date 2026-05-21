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

      that.setData({
        favorites: favorites,
        totalCount: totalCount,
        _loading: false
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
  }
})

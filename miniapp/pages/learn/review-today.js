var learnApi = require('../../api/learn')

Page({
  data: {
    _loading: true,
    reviews: [],
    totalCount: 0,
    completedCount: 0,
    dailyLimit: 20,
    reviewProgress: 0
  },

  onLoad() {
    this.fetchReviewToday()
  },

  onShow() {
    if (this._hasShown) {
      this.fetchReviewToday()
    } else {
      this._hasShown = true
    }
  },

  fetchReviewToday() {
    var that = this
    this.setData({ _loading: true })

    learnApi.getReviewToday().then(function (res) {
      var data = res.data || {}
      var reviews = data.cards || data.reviews || []
      var totalCount = data.total || data.count || reviews.length
      var completedCount = data.completed || 0
      var dailyLimit = data.daily_limit || 20
      var reviewProgress = dailyLimit > 0 ? Math.min(100, (completedCount / dailyLimit) * 100) : 0

      that.setData({
        reviews: reviews,
        totalCount: totalCount,
        completedCount: completedCount,
        dailyLimit: dailyLimit,
        reviewProgress: reviewProgress,
        _loading: false
      })
    }).catch(function () {
      that.setData({ _loading: false })
    })
  },

  onCompleteReview(e) {
    var cardId = e.currentTarget.dataset.cardId
    var that = this

    wx.showModal({
      title: '确认完成',
      content: '标记此卡片复习完成？',
      success: function (res) {
        if (res.confirm) {
          learnApi.completeReview(cardId).then(function () {
            wx.showToast({ title: '复习完成', icon: 'success' })
            that.fetchReviewToday()
          }).catch(function () {
            wx.showToast({ title: '操作失败', icon: 'none' })
          })
        }
      }
    })
  },

  onCardTap(e) {
    var cardId = e.currentTarget.dataset.cardId
    if (cardId) {
      wx.navigateTo({
        url: '/pages/learn/card-detail/card-detail?card_id=' + cardId
      })
    }
  }
})

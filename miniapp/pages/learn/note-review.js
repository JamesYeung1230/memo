var learnApi = require('../../api/learn')

Page({
  data: {
    _loading: true,
    notes: [],
    totalCount: 0
  },

  onLoad() {
    this.fetchReviewNotes()
  },

  onShow() {
    if (this._hasShown) {
      this.fetchReviewNotes()
    } else {
      this._hasShown = true
    }
  },

  fetchReviewNotes() {
    var that = this
    this.setData({ _loading: true })

    learnApi.getReviewToday().then(function (res) {
      var data = res.data || {}
      var reviews = data.cards || data.reviews || []
      var notes = []

      // 从复习卡片中提取带笔记的数据
      for (var i = 0; i < reviews.length; i++) {
        var item = reviews[i]
        if (item.notes || item.user_notes || item.note_content) {
          notes.push({
            id: item.id || item.card_id,
            cardId: item.card_id || item.id,
            title: item.title || item.concept || '',
            content: item.content || item.description || '',
            noteContent: item.notes || item.user_notes || item.note_content || '',
            tags: item.tags || [],
            mastered: item.mastered || false,
            nextReview: item.next_review || ''
          })
        }
      }

      that.setData({
        notes: notes,
        totalCount: notes.length,
        _loading: false
      })
    }).catch(function () {
      that.setData({ _loading: false })
    })
  },

  onNoteTap(e) {
    var noteId = e.currentTarget.dataset.noteId
    var cardId = e.currentTarget.dataset.cardId
    if (noteId) {
      wx.navigateTo({
        url: '/pages/notes/note-detail/note-detail?note_id=' + noteId
      })
    } else if (cardId) {
      wx.navigateTo({
        url: '/pages/learn/card-detail?card_id=' + cardId
      })
    }
  },

  onReviewCard(e) {
    var cardId = e.currentTarget.dataset.cardId
    var that = this

    if (cardId) {
      learnApi.completeReview(cardId).then(function () {
        wx.showToast({ title: '复习完成', icon: 'success' })
        that.fetchReviewNotes()
      }).catch(function () {
        wx.showToast({ title: '操作失败', icon: 'none' })
      })
    }
  },

  onRefresh() {
    this.fetchReviewNotes()
  }
})

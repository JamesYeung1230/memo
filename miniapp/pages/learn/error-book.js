var learnApi = require('../../api/learn')

Page({
  data: {
    _loading: true,
    questions: [],
    totalCount: 0,
    currentPage: 1
  },

  onLoad() {
    this.fetchWrongQuestions()
  },

  onShow() {
    if (this._hasShown) {
      this.fetchWrongQuestions()
    } else {
      this._hasShown = true
    }
  },

  fetchWrongQuestions() {
    var that = this
    this.setData({ _loading: true })

    learnApi.getWrongQuestions().then(function (res) {
      var data = res.data || []
      var questions = Array.isArray(data) ? data : (data.list || data.questions || [])
      var totalCount = data.total || data.count || questions.length

      that.setData({
        questions: questions,
        totalCount: totalCount,
        _loading: false
      })
    }).catch(function () {
      that.setData({ _loading: false })
    })
  },

  onPracticeTap(e) {
    var questionId = e.currentTarget.dataset.questionId
    if (questionId) {
      wx.navigateTo({
        url: '/pages/learn/error-review/error-review?question_id=' + questionId
      })
    }
  },

  onPracticeAll() {
    var questions = this.data.questions
    if (questions.length === 0) {
      wx.showToast({ title: '暂无错题', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: '/pages/learn/error-review/error-review'
    })
  },

  onRefresh() {
    this.fetchWrongQuestions()
  }
})

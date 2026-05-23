var learnApi = require('../../api/learn')
var pointsApi = require('../../api/points')

Page({
  data: {
    _loading: true,
    // 学习天数
    totalDays: 0,
    currentStreak: 0,
    bestStreak: 0,
    // 掌握卡片
    masteredCards: 0,
    totalLearned: 0,
    // 答题统计
    totalQuestions: 0,
    correctCount: 0,
    wrongCount: 0,
    accuracy: '0%',
    // 复习统计
    totalReviews: 0,
    completedReviews: 0,
    // 总积分
    totalPoints: 0,
    // 领域进度
    domainProgress: [],
    // 最近学习记录
    recentActivity: []
  },

  onLoad() {
    this.fetchAllStats()
  },

  onShow() {
    if (this._hasShown) {
      this.fetchAllStats()
    } else {
      this._hasShown = true
    }
  },

  fetchAllStats() {
    var that = this
    that.setData({ _loading: true })

    // 进度数据
    learnApi.getProgress().then(function (res) {
      var progress = res.data || {}

      that.setData({
        totalDays: progress.today_learned || 0,
        totalLearned: progress.total_learned || 0,
        masteredCards: progress.mastered || 0,
      })
    }).catch(function () {})

    // 答题统计
    learnApi.getQuizStats().then(function (res) {
      var data = res.data || {}
      var totalQuestions = data.total_answered || 0
      var correctCount = data.correct_count || 0
      var wrongCount = totalQuestions - correctCount
      var accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) + '%' : '--%'

      that.setData({
        totalQuestions: totalQuestions,
        correctCount: correctCount,
        wrongCount: wrongCount,
        accuracy: accuracy,
        _loading: false
      })
    }).catch(function () {
      that.setData({ _loading: false })
    })

    // 积分余额
    pointsApi.getBalance().then(function (res) {
      var balance = (res.data && res.data.balance) || 0
      that.setData({ totalPoints: balance })
    }).catch(function () {})
  },

  onViewCalendar() {
    wx.navigateTo({ url: '/pages/profile/calendar' })
  },

  onRefresh() {
    this.fetchAllStats()
  }
})

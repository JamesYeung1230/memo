var learnApi = require('../../api/learn')

Page({
  data: {
    _loading: true,
    // 学习天数
    totalDays: 0,
    currentStreak: 0,
    bestStreak: 0,
    // 掌握卡片
    learnedCards: 0,
    totalCards: 0,
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
    this.setData({ _loading: true })

    learnApi.getProgress().then(function (res) {
      var progress = res.data || {}

      that.setData({
        totalDays: progress.total_days || progress.days || 0,
        currentStreak: progress.current_streak || progress.streak_days || 0,
        bestStreak: progress.best_streak || 0,
        learnedCards: progress.learned || 0,
        totalCards: progress.total || 0,
        totalReviews: progress.total_reviews || 0,
        completedReviews: progress.completed_reviews || 0,
        totalPoints: progress.total_points || progress.points || 0,
        domainProgress: progress.domain_progress || []
      })

      that.fetchQuizStats()
    }).catch(function () {
      that.fetchQuizStats()
    })
  },

  fetchQuizStats() {
    var that = this

    learnApi.getQuizStats().then(function (res) {
      var data = res.data || {}
      var totalQuestions = data.total_questions || data.total || 0
      var correctCount = data.correct_count || data.correct || 0
      var wrongCount = data.wrong_count || data.wrong || (totalQuestions - correctCount)
      var accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) + '%' : '0%'

      that.setData({
        totalQuestions: totalQuestions,
        correctCount: correctCount,
        wrongCount: wrongCount,
        accuracy: accuracy,
        recentActivity: data.recent_scores || data.recent_activity || [],
        _loading: false
      })
    }).catch(function () {
      that.setData({ _loading: false })
    })
  },

  onViewCalendar() {
    wx.navigateTo({ url: '/pages/profile/calendar' })
  },

  onRefresh() {
    this.fetchAllStats()
  }
})

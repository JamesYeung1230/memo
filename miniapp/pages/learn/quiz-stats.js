var learnApi = require('../../api/learn')

Page({
  data: {
    _loading: true,
    totalQuestions: 0,
    correctCount: 0,
    wrongCount: 0,
    accuracy: '0%',
    totalQuizzes: 0,
    dailyChallengeCount: 0,
    bestStreak: 0,
    currentStreak: 0,
    totalPoints: 0,
    domainStats: [],
    recentScores: []
  },

  onLoad() {
    this.fetchStats()
  },

  onShow() {
    if (this._hasShown) {
      this.fetchStats()
    } else {
      this._hasShown = true
    }
  },

  fetchStats() {
    var that = this
    this.setData({ _loading: true })

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
        totalQuizzes: data.total_quizzes || data.quiz_count || 0,
        dailyChallengeCount: data.daily_challenge_count || 0,
        bestStreak: data.best_streak || 0,
        currentStreak: data.current_streak || 0,
        totalPoints: data.total_points || 0,
        domainStats: data.domain_stats || [],
        recentScores: data.recent_scores || [],
        _loading: false
      })
    }).catch(function () {
      that.setData({ _loading: false })
    })
  },

  onRefresh() {
    this.fetchStats()
  }
})

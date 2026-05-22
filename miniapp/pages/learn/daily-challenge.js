var learnApi = require('../../api/learn')

var LETTERS = ['A', 'B', 'C', 'D']

Page({
  data: {
    _loading: true,
    _submitting: false,
    questions: [],
    totalQuestions: 0,
    answeredCount: 0,
    statusBarHeight: 0
  },

  onLoad() {
    var info = wx.getSystemInfoSync()
    this.setData({ statusBarHeight: info.statusBarHeight }, function () {
      this.fetchDailyChallenge()
    })
  },

  fetchDailyChallenge() {
    var that = this
    this.setData({ _loading: true })

    learnApi.getDailyChallenge().then(function (res) {
      // res.data = { challenge_id, date, is_completed, questions: [...] }
      var data = res.data || {}
      var questions = data.questions || []
      // 将后端返回的选项对象({"A":"text","B":"text"})转为数组
      var processed = questions.map(function (q, qIdx) {
        var opts = q.options || {}
        var keys = Object.keys(opts)
        var options = keys.map(function (k) {
          return {
            letter: k,
            text: opts[k],
            value: k,
            selected: false,
            status: 'default'
          }
        })
        return {
          id: q.question_id || q.id,
          question: q.question_text || q.question || '',
          options: options,
          explanation: q.explanation || ''
        }
      })

      that.setData({
        questions: processed,
        totalQuestions: processed.length,
        _loading: false
      })
    }).catch(function () {
      that.setData({ _loading: false })
    })
  },

  onOptionSelect(e) {
    var questionIdx = e.mark && e.mark['question-idx']
    if (questionIdx === undefined) return
    var selectedLetter = e.detail.letter
    var selectedValue = e.detail.text

    var questions = this.data.questions
    var q = questions[questionIdx]
    if (!q) return

    // 更新该题的选择状态
    q.options.forEach(function (opt) {
      opt.selected = opt.letter === selectedLetter
    })
    q.selectedValue = selectedValue

    // 计算已答题数
    var answeredCount = 0
    questions.forEach(function (question) {
      if (question.options.some(function (o) { return o.selected })) {
        answeredCount += 1
      }
    })

    this.setData({
      questions: questions,
      answeredCount: answeredCount
    })
  },

  onSubmitAll() {
    var that = this

    // 检查是否所有题都已答
    var allAnswered = this.data.questions.every(function (q) {
      return q.options.some(function (o) { return o.selected })
    })

    if (!allAnswered) {
      wx.showToast({
        title: '请完成所有题目',
        icon: 'none'
      })
      return
    }

    this.setData({ _submitting: true })

    // 组装答案数据
    var answers = this.data.questions.map(function (q) {
      var selected = q.options.find(function (o) { return o.selected })
      return {
        question_id: q.id,
        selected_option: selected ? selected.value : ''
      }
    })

    learnApi.submitDailyChallenge(answers).then(function (res) {
      var result = res.data || {}

      var correctCount = result.correct || 0

      // 标记每道题的正确/错误状态
      var questions = that.data.questions
      questions.forEach(function (q, idx) {
        q.showExplanation = false
      })

      that.setData({
        questions: questions,
        _submitting: false,
        _showResults: true
      })

      // 跳转到结果页面
      var resultData = {
        total: that.data.totalQuestions,
        correct: correctCount,
        wrong: that.data.totalQuestions - correctCount,
        type: 'challenge',
        points: result.points_earned || 0,
        streak_days: result.streak_days || 0
      }

      wx.redirectTo({
        url: '/pages/learn/challenge-result?result=' + encodeURIComponent(JSON.stringify(resultData))
      })
    }).catch(function () {
      that.setData({ _submitting: false })
      wx.showToast({
        title: '提交失败',
        icon: 'none'
      })
    })
  },

  onRetry() {
    this.setData({
      _loading: true,
      questions: [],
      answeredCount: 0,
      _showResults: false
    }, function () {
      this.fetchDailyChallenge()
    })
  }
})

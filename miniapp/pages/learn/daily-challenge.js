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
      var questions = res.data || []
      // 为每道题创建选项映射和答案记录
      var processed = questions.map(function (q, qIdx) {
        var options = (q.options || []).map(function (opt, oIdx) {
          return {
            letter: LETTERS[oIdx] || '',
            text: typeof opt === 'string' ? opt : (opt.text || opt.content || ''),
            value: typeof opt === 'string' ? opt : (opt.value || opt.id || ''),
            selected: false,
            status: 'default'
          }
        })
        return {
          id: q.id,
          question: q.question || q.content || '',
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
    var questionIdx = e.currentTarget.dataset.questionIdx
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

      // 标记每道题的正确/错误状态
      var questionResults = result.results || []
      var correctCount = 0
      var questions = that.data.questions

      questions.forEach(function (q, idx) {
        var qr = questionResults[idx] || {}
        if (qr.correct) {
          correctCount += 1
        }
        // 更新选项显示状态
        q.options.forEach(function (opt) {
          if (opt.selected) {
            opt.status = qr.correct ? 'correct' : 'wrong'
          }
          if (opt.text === qr.correct_answer || opt.letter === qr.correct_answer) {
            if (opt.letter !== (q.options.find(function (o) { return o.selected }) || {}).letter || !qr.correct) {
              opt.status = 'correct'
            }
          }
        })
        q.showExplanation = true
      })

      that.setData({
        questions: questions,
        _submitting: false,
        _showResults: true
      })

      // 跳转到结果页面
      var resultData = {
        total: that.data.totalQuestions,
        correct: result.correct_count || correctCount,
        wrong: that.data.totalQuestions - (result.correct_count || correctCount),
        type: 'challenge',
        points: result.points || 0,
        streak_days: result.streak_days || 0
      }

      wx.redirectTo({
        url: '/pages/learn/challenge-result/challenge-result?result=' + encodeURIComponent(JSON.stringify(resultData))
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

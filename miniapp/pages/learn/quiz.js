var learnApi = require('../../api/learn')

var LETTERS = ['A', 'B', 'C', 'D']

Page({
  data: {
    _loading: true,
    domainId: null,
    questions: [],
    currentIndex: 0,
    totalQuestions: 0,
    correctCount: 0,
    selectedOption: null,
    isAnswered: false,
    isCorrect: false,
    correctAnswer: '',
    explanation: '',
    statusBarHeight: 0
  },

  onLoad(options) {
    var domainId = options.domain_id
    this.setData({
      domainId: domainId,
      currentIndex: 0,
      correctCount: 0
    }, function () {
      this.fetchQuestions()
    })
  },

  fetchQuestions() {
    var that = this
    this.setData({ _loading: true })

    learnApi.getQuizQuestions(this.data.domainId).then(function (res) {
      var questions = res.data || []
      that.setData({
        questions: questions,
        totalQuestions: questions.length,
        _loading: false
      })

      if (questions.length > 0) {
        that.prepareCurrentQuestion()
      }
    }).catch(function () {
      that.setData({ _loading: false })
    })
  },

  prepareCurrentQuestion() {
    var currentQ = this.data.questions[this.data.currentIndex]
    if (!currentQ) return

    // Add letter mapping to options
    var options = (currentQ.options || []).map(function (opt, idx) {
      return {
        letter: LETTERS[idx] || '',
        text: typeof opt === 'string' ? opt : (opt.text || opt.content || ''),
        value: typeof opt === 'string' ? opt : (opt.value || opt.id || ''),
        status: 'default',
        explanation: ''
      }
    })

    this.setData({
      currentQuestionOptions: options,
      selectedOption: null,
      isAnswered: false,
      isCorrect: false,
      correctAnswer: currentQ.correct_answer || currentQ.answer || '',
      explanation: currentQ.explanation || ''
    })
  },

  onOptionSelect(e) {
    if (this.data.isAnswered) return

    var selectedLetter = e.detail.letter
    var that = this

    // 立即标记选中状态
    var options = this.data.currentQuestionOptions.map(function (opt) {
      opt.selected = opt.letter === selectedLetter
      return opt
    })
    this.setData({
      selectedOption: selectedLetter,
      currentQuestionOptions: options
    })

    // 提交答案
    var currentQ = this.data.questions[this.data.currentIndex]
    learnApi.submitAnswer(currentQ.id, selectedLetter).then(function (res) {
      var result = res.data || {}
      var isCorrect = result.correct || false
      var correctAnswer = result.correct_answer || currentQ.correct_answer || currentQ.answer || ''

      // 更新选项状态
      var updatedOptions = that.data.currentQuestionOptions.map(function (opt) {
        if (opt.letter === selectedLetter) {
          opt.status = isCorrect ? 'correct' : 'wrong'
        }
        if (opt.text === correctAnswer || opt.letter === correctAnswer) {
          if (opt.letter !== selectedLetter || !isCorrect) {
            opt.status = 'correct'
          }
        }
        // 显示解析
        opt.showExplanation = that.data.explanation ? true : false
        return opt
      })

      var newCorrectCount = that.data.correctCount
      if (isCorrect) {
        newCorrectCount += 1
      }

      that.setData({
        currentQuestionOptions: updatedOptions,
        isAnswered: true,
        isCorrect: isCorrect,
        correctAnswer: correctAnswer,
        correctCount: newCorrectCount
      })
    }).catch(function () {
      // 提交失败 - 显示正确答案
      var updatedOptions = that.data.currentQuestionOptions.map(function (opt) {
        if (opt.text === that.data.correctAnswer || opt.letter === that.data.correctAnswer) {
          opt.status = 'correct'
        }
        opt.showExplanation = true
        return opt
      })
      that.setData({
        currentQuestionOptions: updatedOptions,
        isAnswered: true
      })
    })
  },

  onNext() {
    var nextIndex = this.data.currentIndex + 1

    if (nextIndex >= this.data.totalQuestions) {
      // 所有题目答完，跳转结果页
      var result = {
        total: this.data.totalQuestions,
        correct: this.data.correctCount,
        wrong: this.data.totalQuestions - this.data.correctCount,
        type: 'quiz'
      }
      wx.redirectTo({
        url: '/pages/learn/quiz-result?result=' + encodeURIComponent(JSON.stringify(result))
      })
      return
    }

    this.setData({
      currentIndex: nextIndex,
      currentQuestionOptions: []
    }, function () {
      this.prepareCurrentQuestion()
    })
  },

  onRetry() {
    this.setData({
      currentIndex: 0,
      correctCount: 0,
      _loading: true
    }, function () {
      this.fetchQuestions()
    })
  }
})

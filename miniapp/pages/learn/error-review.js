var learnApi = require('../../api/learn')

var LETTERS = ['A', 'B', 'C', 'D']

Page({
  data: {
    _loading: true,
    questionId: null,
    question: null,
    options: [],
    selectedOption: null,
    isAnswered: false,
    isCorrect: false,
    correctAnswer: '',
    explanation: '',
    currentIndex: 0,
    totalQuestions: 0,
    questions: [],
    correctCount: 0,
    showResult: false
  },

  onLoad(options) {
    var questionId = options.question_id || null
    this.setData({ questionId: questionId }, function () {
      this.fetchQuestions()
    })
  },

  fetchQuestions() {
    var that = this
    this.setData({ _loading: true })

    if (this.data.questionId) {
      // 单个错题复习
      learnApi.getWrongQuestions().then(function (res) {
        var data = res.data || []
        var questions = Array.isArray(data) ? data : (data.list || data.questions || [])
        var targetQuestion = null

        for (var i = 0; i < questions.length; i++) {
          if (questions[i].id == that.data.questionId || questions[i].question_id == that.data.questionId) {
            targetQuestion = questions[i]
            break
          }
        }

        if (targetQuestion) {
          that.setData({
            questions: [targetQuestion],
            totalQuestions: 1,
            _loading: false
          })
          that.prepareCurrentQuestion()
        } else {
          that.setData({ _loading: false })
          wx.showToast({ title: '未找到该错题', icon: 'none' })
        }
      }).catch(function () {
        that.setData({ _loading: false })
      })
    } else {
      this.fetchAllWrongQuestions()
    }
  },

  fetchAllWrongQuestions() {
    var that = this
    learnApi.getWrongQuestions().then(function (res) {
      var data = res.data || []
      var questions = Array.isArray(data) ? data : (data.list || data.questions || [])

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

    var questionText = currentQ.question_text || currentQ.question || currentQ.title || currentQ.content || ''
    var options = (currentQ.options || []).map(function (opt, idx) {
      return {
        letter: opt.letter || LETTERS[idx] || '',
        text: typeof opt === 'string' ? opt : (opt.text || opt.content || ''),
        value: typeof opt === 'string' ? opt : (opt.value || opt.id || ''),
        status: 'default'
      }
    })

    this.setData({
      question: {
        text: questionText,
        id: currentQ.id || currentQ.question_id
      },
      options: options,
      selectedOption: null,
      isAnswered: false,
      isCorrect: false,
      correctAnswer: currentQ.correct_answer || currentQ.correct_option || currentQ.answer || '',
      explanation: currentQ.explanation || ''
    })
  },

  onOptionSelect(e) {
    if (this.data.isAnswered) return

    var index = e.currentTarget.dataset.index
    var selectedOption = this.data.options[index]
    var that = this

    var options = this.data.options.map(function (opt) {
      opt.selected = opt.letter === selectedOption.letter
      return opt
    })

    this.setData({
      selectedOption: selectedOption,
      options: options
    })

    var currentQ = this.data.questions[this.data.currentIndex]
    var questionId = currentQ.question_id || currentQ.id

    learnApi.errorPractice(questionId, selectedOption.letter).then(function (res) {
      var result = res.data || {}
      var isCorrect = result.correct !== undefined ? result.correct : (result.is_correct || false)
      var correctAnswer = result.correct_answer || result.correct_option || currentQ.correct_answer || currentQ.correct_option || currentQ.answer || ''

      var updatedOptions = that.data.options.map(function (opt) {
        if (opt.letter === selectedOption.letter) {
          opt.status = isCorrect ? 'correct' : 'wrong'
        }
        if (opt.text === correctAnswer || opt.letter === correctAnswer || opt.value === correctAnswer) {
          if (opt.letter !== selectedOption.letter || !isCorrect) {
            opt.status = 'correct'
          }
        }
        return opt
      })

      var newCorrectCount = that.data.correctCount
      if (isCorrect) {
        newCorrectCount += 1
      }

      that.setData({
        options: updatedOptions,
        isAnswered: true,
        isCorrect: isCorrect,
        correctAnswer: correctAnswer,
        correctCount: newCorrectCount
      })
    }).catch(function () {
      var updatedOptions = that.data.options.map(function (opt) {
        if (opt.text === that.data.correctAnswer || opt.letter === that.data.correctAnswer || opt.value === that.data.correctAnswer) {
          opt.status = 'correct'
        }
        if (opt.letter === selectedOption.letter) {
          opt.status = 'wrong'
        }
        return opt
      })

      that.setData({
        options: updatedOptions,
        isAnswered: true
      })
    })
  },

  onNext() {
    var nextIndex = this.data.currentIndex + 1

    if (nextIndex >= this.data.totalQuestions) {
      this.setData({
        showResult: true
      })
      return
    }

    this.setData({
      currentIndex: nextIndex,
      options: []
    }, function () {
      this.prepareCurrentQuestion()
    })
  },

  onRetry() {
    this.setData({
      currentIndex: 0,
      correctCount: 0,
      showResult: false,
      _loading: true
    }, function () {
      this.fetchQuestions()
    })
  },

  onGoBack() {
    wx.navigateBack()
  }
})

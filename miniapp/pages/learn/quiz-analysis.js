var LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

Page({
  data: {
    _loading: true,
    questionText: '',
    options: [],
    correctAnswer: '',
    explanation: '',
    selectedOption: '',
    isCorrect: false
  },

  onLoad(options) {
    // 优先从 encoded 参数解析（统一入口）
    if (options.encoded) {
      try {
        var decoded = JSON.parse(decodeURIComponent(options.encoded))
        this.renderAnalysis(decoded)
        return
      } catch (e) {
        console.error('quiz-analysis: encoded parse error', e)
      }
    }

    // 回退：从独立参数构建
    var questionText = options.question_text || ''
    var correctAnswer = options.correct_answer || ''
    var explanation = options.explanation || ''
    var selectedOption = options.selected_option || ''
    var parsedOptions = []

    if (options.options) {
      try {
        parsedOptions = JSON.parse(decodeURIComponent(options.options))
      } catch (e) {
        console.error('quiz-analysis: options parse error', e)
      }
    }

    // 如果 options 是扁平字符串数组，转为对象数组
    if (parsedOptions.length > 0 && typeof parsedOptions[0] === 'string') {
      parsedOptions = parsedOptions.map(function (opt, idx) {
        return {
          letter: LETTERS[idx] || '',
          text: opt,
          isCorrect: opt === correctAnswer || LETTERS[idx] === correctAnswer,
          isSelected: opt === selectedOption || LETTERS[idx] === selectedOption
        }
      })
    }

    // 如果已经是对象数组（含 letter/text/value 等键），合并 isCorrect/isSelected
    if (parsedOptions.length > 0 && typeof parsedOptions[0] === 'object') {
      parsedOptions = parsedOptions.map(function (opt) {
        var optText = opt.text || opt.content || opt.value || ''
        var optLetter = opt.letter || ''
        return {
          letter: optLetter,
          text: optText,
          isCorrect: opt.is_correct || opt.isCorrect || optText === correctAnswer || optLetter === correctAnswer || opt.status === 'correct' || false,
          isSelected: opt.is_selected || opt.isSelected || optText === selectedOption || optLetter === selectedOption || opt.selected || false
        }
      })
    }

    this.renderAnalysis({
      questionText: questionText,
      options: parsedOptions,
      correctAnswer: correctAnswer,
      explanation: explanation,
      selectedOption: selectedOption
    })
  },

  renderAnalysis(data) {
    var questionText = data.questionText || data.question_text || ''
    var options = data.options || []
    var correctAnswer = data.correctAnswer || data.correct_answer || ''
    var explanation = data.explanation || ''
    var selectedOption = data.selectedOption || data.selected_option || ''

    // 确保选项有序号字母
    var mappedOptions = options.map(function (opt, idx) {
      if (!opt.letter) {
        opt.letter = LETTERS[idx] || ''
      }
      return opt
    })

    // 判断用户是否正确
    var isCorrect = false
    for (var i = 0; i < mappedOptions.length; i++) {
      if (mappedOptions[i].isSelected) {
        isCorrect = mappedOptions[i].isCorrect
        break
      }
    }

    this.setData({
      _loading: false,
      questionText: questionText,
      options: mappedOptions,
      correctAnswer: correctAnswer,
      explanation: explanation,
      selectedOption: selectedOption,
      isCorrect: isCorrect
    })
  },

  onGoBack() {
    var pages = getCurrentPages()
    if (pages.length >= 2) {
      wx.navigateBack()
    } else {
      wx.switchTab({ url: '/pages/learn/learn' })
    }
  }
})

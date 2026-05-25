Page({
  data: {
    result: null,
    total: 0,
    correct: 0,
    wrong: 0,
    accuracy: 0,
    displayScore: 0,
    displayAccuracy: 0,
    statusBarHeight: 0,
    _animating: false
  },

  onLoad(options) {
    var info = wx.getSystemInfoSync()
    this.setData({ statusBarHeight: info.statusBarHeight })

    var resultStr = options.result || '{}'
    try {
      var result = JSON.parse(decodeURIComponent(resultStr))
      var total = result.total || 0
      var correct = result.correct || 0
      var wrong = result.wrong || 0
      var accuracy = total > 0 ? Math.round((correct / total) * 100) : 0

      this.setData({
        result: result,
        total: total,
        correct: correct,
        wrong: wrong,
        accuracy: accuracy
      }, function () {
        this.startAnimation()
      })
    } catch (e) {
      wx.showToast({
        title: '数据异常',
        icon: 'none'
      })
    }
  },

  startAnimation() {
    this.setData({ _animating: true })

    var that = this
    var targetScore = this.data.correct
    var targetAccuracy = this.data.accuracy
    var duration = 800
    var interval = 30
    var steps = duration / interval

    var scoreStep = targetScore / steps
    var accuracyStep = targetAccuracy / steps
    var currentStep = 0

    var timer = setInterval(function () {
      currentStep += 1
      if (currentStep >= steps) {
        that.setData({
          displayScore: targetScore,
          displayAccuracy: targetAccuracy,
          _animating: false
        })
        clearInterval(timer)
      } else {
        that.setData({
          displayScore: Math.round(scoreStep * currentStep),
          displayAccuracy: Math.round(accuracyStep * currentStep)
        })
      }
    }, interval)
  },

  onGoBack() {
    var pages = getCurrentPages()
    // 回到主页
    if (pages.length >= 2) {
      wx.navigateBack()
    } else {
      wx.switchTab({ url: '/pages/learn/learn' })
    }
  },

  onRetry() {
    wx.navigateBack()
  },

  onShareAppMessage() {
    return {
      title: '我在 CodeSail 答题正确率 ' + this.data.accuracy + '%！',
      path: '/pages/learn/learn'
    }
  }
})

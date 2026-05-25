Page({
  data: {
    result: null,
    total: 0,
    correct: 0,
    wrong: 0,
    accuracy: 0,
    points: 0,
    streakDays: 0,
    displayScore: 0,
    displayAccuracy: 0,
    displayPoints: 0,
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
      var points = result.points || 0
      var streakDays = result.streak_days || 0

      this.setData({
        result: result,
        total: total,
        correct: correct,
        wrong: wrong,
        accuracy: accuracy,
        points: points,
        streakDays: streakDays
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
    var targetPoints = this.data.points
    var duration = 1000
    var interval = 30
    var steps = duration / interval

    var scoreStep = targetScore / steps
    var accuracyStep = targetAccuracy / steps
    var pointsStep = targetPoints / steps
    var currentStep = 0

    var timer = setInterval(function () {
      currentStep += 1
      if (currentStep >= steps) {
        that.setData({
          displayScore: targetScore,
          displayAccuracy: targetAccuracy,
          displayPoints: targetPoints,
          _animating: false
        })
        clearInterval(timer)
      } else {
        that.setData({
          displayScore: Math.round(scoreStep * currentStep),
          displayAccuracy: Math.round(accuracyStep * currentStep),
          displayPoints: Math.round(pointsStep * currentStep)
        })
      }
    }, interval)
  },

  onGoHome() {
    // 回到学习主页
    wx.switchTab({ url: '/pages/learn/learn' })
  },

  onShare() {
    var that = this
    wx.showActionSheet({
      itemList: ['分享给朋友'],
      success: function () {
        // 触发 onShareAppMessage
        wx.shareAppMessage ? wx.shareAppMessage() : wx.showToast({
          title: '请点击右上角分享',
          icon: 'none'
        })
      }
    })
  },

  onShareAppMessage() {
    return {
      title: '我在 CodeSail 每日挑战答对 ' + this.data.correct + '/' + this.data.total + ' 题！',
      path: '/pages/learn/learn'
    }
  }
})

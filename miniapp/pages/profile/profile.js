var app = getApp()
var learnApi = require('../../api/learn')

Page({
  data: {
    _pageEnter: true,
    userInfo: null,
    userName: '未登录',
    userLevel: '点击登录',
    avatarText: '?',
    learnedCards: '--/--',
    accuracyRate: '--%',
    streakDays: '--天',
    masteredCount: 0,
    accuracy: 0,
    streak: 0
  },

  onLoad() {
    this.loadUserData()
    this.loadStats()
  },

  onShow() {
    if (this._hasShown) {
      this.setData({ _pageEnter: false }, function () {
        this.setData({ _pageEnter: true })
      })
      this.loadUserData()
      this.loadStats()
    } else {
      this._hasShown = true
    }
  },

  loadUserData() {
    var userInfo = app.globalData.userInfo
    if (userInfo) {
      var nickName = userInfo.nickName || userInfo.nickname || '用户'
      var firstChar = nickName.charAt(0).toUpperCase()
      var levelText = ''

      if (userInfo.level || userInfo.user_level) {
        var lvl = userInfo.level || userInfo.user_level
        levelText = 'Lv.' + lvl + ' · '
      }
      levelText += (userInfo.title || '编程学习者')

      this.setData({
        userInfo: userInfo,
        userName: nickName,
        userLevel: levelText,
        avatarText: firstChar
      })
    }
  },

  loadStats() {
    var that = this

    learnApi.getProgress().then(function (res) {
      var progress = res.data || {}
      var learned = progress.learned || 0
      var total = progress.total || 0
      var accuracy = progress.accuracy || 0
      var streak = progress.streak_days || progress.current_streak || 0

      that.setData({
        learnedCards: learned + '/' + total,
        accuracyRate: accuracy + '%',
        streakDays: streak + '天',
        masteredCount: learned,
        accuracy: accuracy,
        streak: streak
      })
    }).catch(function () {})

    learnApi.getQuizStats().then(function (res) {
      var stats = res.data || {}
      var accuracy = stats.total_questions > 0
        ? Math.round((stats.correct_count / stats.total_questions) * 100)
        : (stats.accuracy || 0)
      var streak = stats.current_streak || stats.streak_days || 0

      that.setData({
        accuracy: accuracy,
        streak: streak,
        streakDays: streak + '天'
      })
    }).catch(function () {})
  },

  onUserTap() {
    if (!app.globalData.isLoggedIn) {
      wx.navigateTo({ url: '/pages/login/login' })
      return
    }
    wx.showToast({ title: '个人资料', icon: 'none' })
  },

  onMenuTap(e) {
    var page = e.currentTarget.dataset.page
    var paths = {
      'study-stats': '/pages/profile/study-stats',
      'favorites': '/pages/profile/favorites',
      'achievements': '/pages/points/achievements',
      'audit-history': '/pages/profile/audit-history'
    }
    var url = paths[page]
    if (url) {
      wx.navigateTo({ url: url })
    }
  },

  onSettingsTap() {
    wx.navigateTo({ url: '/pages/profile/settings' })
  }
})

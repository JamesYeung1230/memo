var app = getApp()
var learnApi = require('../../api/learn')

Page({
  data: {
    _pageEnter: true,
    userInfo: null,
    userName: '未登录',
    userLevel: '点击登录',
    avatarText: '?',
    masteredCount: 0,
    accuracyRate: '--%',
    streakDays: '--天'
  },

  onLoad() {
    this.checkLoginAndLoad()
  },

  onShow() {
    this.checkLoginAndLoad()

    if (this._hasShown) {
      this.setData({ _pageEnter: false }, function () {
        this.setData({ _pageEnter: true })
      })
    } else {
      this._hasShown = true
    }
  },

  checkLoginAndLoad() {
    // 双重确认: globalData + storage
    var isLoggedIn = app.globalData.isLoggedIn || !!wx.getStorageSync('token')
    if (!isLoggedIn) {
      this.setData({
        userName: '未登录',
        userLevel: '点击登录',
        avatarText: '?',
        masteredCount: 0,
        accuracyRate: '--%',
        streakDays: '--天'
      })
      return
    }
    this.loadUserData()
    this.loadStats()
  },

  loadUserData() {
    var userInfo = app.globalData.userInfo
    if (userInfo) {
      var nickName = userInfo.nickName || userInfo.nickname || '用户'
      var firstChar = nickName.charAt(0).toUpperCase()
      var level = userInfo.level || userInfo.user_level || 1
      var levelText = 'Lv.' + level + ' · 编程学习者'

      this.setData({
        userInfo: userInfo,
        userName: nickName,
        userLevel: levelText,
        avatarText: firstChar
      })
    } else {
      // 已登录但userInfo为null时仍显示合理占位
      this.setData({
        userName: '用户',
        userLevel: '已登录',
        avatarText: 'U'
      })
    }
  },

  loadStats() {
    var that = this

    learnApi.getProgress().then(function (res) {
      var progress = res.data || {}
      var mastered = progress.mastered || 0
      var streak = progress.current_streak || 0

      that.setData({
        masteredCount: mastered,
        streakDays: streak > 0 ? streak + '天' : '--天'
      })
    }).catch(function () {})

    learnApi.getQuizStats().then(function (res) {
      var quizStats = res.data || {}
      var accuracy = quizStats.accuracy || 0

      that.setData({
        accuracyRate: accuracy + '%'
      })
    }).catch(function () {})
  },

  onUserTap() {
    if (!app.globalData.isLoggedIn) {
      wx.navigateTo({ url: '/pages/login/login' })
      return
    }
    wx.navigateTo({ url: '/pages/profile/general-settings' })
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
  }
})

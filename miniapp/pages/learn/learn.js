var learnApi = require('../../api/learn')

Page({
  data: {
    _pageEnter: true,
    _loading: true,
    domains: [],
    activeTagIndex: 0,
    statusBarHeight: 0,
    // 概览数据
    currentDomainName: '',
    currentDomainStatus: '',
    learnedCards: '--/--',
    accuracyRate: '--%',
    points: 0,
    // 复习数据
    reviewCount: 0,
    wrongCount: 0,
    // 错误书数量
    errorCount: 0,
    // 进度数据
    progress: null,
    reviewToday: null,
    // 最近学习提示
    lastStudyHint: ''
  },

  onLoad() {
    var info = wx.getSystemInfoSync()
    this.setData({ statusBarHeight: info.statusBarHeight }, function () {
      this.loadAllData()
    })
  },

  onShow() {
    if (this._hasShown) {
      this.setData({ _pageEnter: false }, function () {
        this.setData({ _pageEnter: true })
      })
      this.loadAllData()
    } else {
      this._hasShown = true
    }
  },

  loadAllData() {
    this.fetchDomains()
    this.fetchProgress()
    this.fetchReviewToday()
    this.fetchErrorCount()
  },

  fetchDomains() {
    var that = this
    learnApi.getDomains().then(function (res) {
      var domains = res.data || []
      that.setData({
        domains: domains,
        activeTagIndex: 0,
        _loading: false
      })
      if (domains.length > 0) {
        that.updateOverview(domains[0], 0)
      }
    }).catch(function () {
      that.setData({ _loading: false })
    })
  },

  fetchProgress() {
    var that = this
    learnApi.getProgress().then(function (res) {
      var progress = res.data || null
      that.setData({ progress: progress })
      if (progress) {
        that.setData({
          learnedCards: (progress.learned || 0) + '/' + (progress.total || 0),
          accuracyRate: (progress.accuracy || 0) + '%',
          points: progress.total_points || progress.points || 0
        })
      }
    }).catch(function () {})
  },

  fetchReviewToday() {
    var that = this
    learnApi.getReviewToday().then(function (res) {
      var review = res.data || null
      that.setData({ reviewToday: review })
      if (review) {
        that.setData({
          reviewCount: review.count || review.total || 0
        })
      }
    }).catch(function () {})
  },

  fetchErrorCount() {
    var that = this
    learnApi.getWrongQuestions().then(function (res) {
      var wrong = res.data || []
      var count = Array.isArray(wrong) ? wrong.length : (wrong.total || wrong.count || 0)
      that.setData({ errorCount: count })
    }).catch(function () {})
  },

  updateOverview(domain, index) {
    var statusMap = {
      not_started: '未开始',
      in_progress: '学习中',
      completed: '已学完',
      published: '已发布',
      draft: '草稿'
    }
    this.setData({
      currentDomainName: domain.name || '',
      currentDomainStatus: statusMap[domain.status] || domain.status || '学习中',
      activeTagIndex: index
    })
  },

  onTagTap(e) {
    var index = e.currentTarget.dataset.index
    var domain = this.data.domains[index]
    if (domain) {
      this.updateOverview(domain, index)
    }
  },

  onCardLearnTap() {
    var activeDomain = this.data.domains[this.data.activeTagIndex]
    if (activeDomain) {
      wx.navigateTo({
        url: '/pages/learn/knowledge-tree'
      })
    } else {
      wx.navigateTo({ url: '/pages/learn/knowledge-tree' })
    }
  },

  onQuizTap() {
    wx.navigateTo({ url: '/pages/learn/error-book' })
  },

  onReviewTodayTap() {
    wx.navigateTo({ url: '/pages/learn/review-today' })
  },

  onErrorReviewTap() {
    wx.navigateTo({ url: '/pages/learn/error-review' })
  },

  onReviewSettingsTap() {
    wx.navigateTo({ url: '/pages/learn/review-settings' })
  },

  onDailyChallengeTap() {
    wx.navigateTo({ url: '/pages/learn/daily-challenge' })
  }
})

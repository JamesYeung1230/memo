var learnApi = require('../../api/learn')
var pointsApi = require('../../api/points')

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
    this.fetchPoints()
    this.fetchReviewToday()
    this.fetchErrorCount()
  },

  fetchDomains() {
    var that = this
    learnApi.getDomains().then(function (res) {
      var domains = res.data || []
      // 过滤掉无效/垃圾数据（无名称、无ID、或名称为模板占位符的领域）
      var validDomains = []
      for (var i = 0; i < domains.length; i++) {
        var d = domains[i]
        if (d && d.id && d.name && d.name.indexOf('{') === -1 && d.name.indexOf('domain') === -1 && d.name !== '新领域' && d.name !== '新建领域') {
          validDomains.push(d)
        }
      }
      that.setData({
        domains: validDomains,
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
        var total = progress.total_learned || 0
        var mastered = progress.mastered || 0
        var today = progress.today_learned || 0
        var acc = total > 0 ? Math.round(mastered / total * 100) : 0
        that.setData({
          learnedCards: today + ' / ' + total,
          accuracyRate: acc + '%',
        })
      }
    }).catch(function () {})
  },

  fetchPoints() {
    var that = this
    pointsApi.getBalance().then(function (res) {
      var balance = (res.data && res.data.balance) || 0
      that.setData({ points: balance })
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
    // 切换到该领域后刷新进度
    this.fetchProgress()
    this.fetchReviewToday()
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
        url: '/pages/learn/knowledge-tree?domain_id=' + activeDomain.id + '&domain_name=' + (activeDomain.name || '')
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

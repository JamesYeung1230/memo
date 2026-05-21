var learnApi = require('../../api/learn')
var pointsApi = require('../../api/points')

Page({
  data: {
    _pageEnter: true,
    navTitle: '码上启航',
    bannerText: '新知识领域上线！',
    ringPercent: '0%',
    statLine1: '加载中...',
    statLine2: '保持学习节奏',
    reviewTitle: '今日复习',
    reviewSub: '待复习 0 张卡片',
    reviewBadgeNum: '0',
    sectionLabel: '推荐知识卡片',
    cardTagText: '',
    cardTitle: '',
    cardConcept: '',
    cardDesc: '',
    tags: [],
    gotItText: '懂了',
    saveText: '收藏',
    challengeTitle: '每日挑战',
    challengeSub: '尚未完成今日挑战',
    challengeBtnText: '开始',
    notesPlaceholder: '快速创建笔记...',
    pointsEmoji: '⭐',
    pointsAmount: '积分余额: 0',
    pointsAdText: '看广告 +10',
    currentCardId: null
  },

  onLoad() {
    this.loadHomeData()
  },

  onShow() {
    var app = getApp()
    if (!app.globalData.isLoggedIn) {
      wx.reLaunch({ url: '/pages/login/login' })
      return
    }

    if (this._hasShown) {
      this.setData({ _pageEnter: false }, function () {
        this.setData({ _pageEnter: true })
      })
    } else {
      this._hasShown = true
    }

    this.loadHomeData()
  },

  loadHomeData() {
    var self = this

    Promise.all([
      learnApi.getProgress().catch(function () { return {} }),
      learnApi.getReviewToday().catch(function () { return {} }),
      learnApi.getDailyChallenge().catch(function () { return {} }),
      pointsApi.getBalance().catch(function () { return {} })
    ]).then(function (results) {
      var progress = results[0] || {}
      var review = results[1] || {}
      var challenge = results[2] || {}
      var balance = results[3] || {}

      var totalLearned = progress.total_learned || 0
      var mastered = progress.mastered || 0
      var progressPct = totalLearned > 0 ? Math.round(mastered / totalLearned * 100) : 0

      var reviewCards = review.cards || []
      var reviewCount = review.total || 0

      var challengeCompleted = challenge.is_completed || false
      var allCorrect = challenge.all_correct || false
      var pointsEarned = challenge.points_earned || 0

      var balanceAmount = balance.balance || 0

      self.setData({
        ringPercent: progressPct + '%',
        statLine1: '今日已学 ' + totalLearned + ' 张卡片',
        statLine2: progressPct >= 50 ? '太棒了！继续加油' : '继续加油！保持学习节奏',
        reviewSub: '待复习 ' + reviewCount + ' 张卡片',
        reviewBadgeNum: String(reviewCount),
        challengeSub: challengeCompleted ? (allCorrect ? '全对 +' + pointsEarned + ' 积分' : '已完成') : '尚未完成今日挑战',
        pointsAmount: '积分余额: ' + balanceAmount
      })
    })
  },

  onBannerTap() {},

  onReviewTap() {
    wx.navigateTo({ url: '/pages/learn/review-today' })
  },

  onCardGotIt() {
    var self = this
    var cardId = self.data.currentCardId
    if (!cardId) return
    learnApi.masterCard(cardId).then(function () {
      wx.showToast({ title: '已掌握', icon: 'success' })
    }).catch(function () {
      wx.showToast({ title: '操作失败', icon: 'none' })
    })
  },

  onCardSave() {
    var self = this
    var cardId = self.data.currentCardId
    if (!cardId) return
    learnApi.favoriteCard(cardId).then(function () {
      wx.showToast({ title: '已收藏', icon: 'success' })
    }).catch(function () {
      wx.showToast({ title: '操作失败', icon: 'none' })
    })
  },

  onChallengeStart() {
    wx.navigateTo({ url: '/pages/learn/daily-challenge' })
  },

  onQuickNote() {
    wx.navigateTo({ url: '/pages/notes/note-editor' })
  },

  onWatchAd() {
    var self = this
    pointsApi.adWatch().then(function (res) {
      wx.showToast({ title: '+10 积分', icon: 'success' })
      self.loadHomeData()
    }).catch(function (err) {
      wx.showToast({ title: err.message || '获取积分失败', icon: 'none' })
    })
  }
})

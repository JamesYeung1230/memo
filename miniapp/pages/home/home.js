var learnApi = require('../../api/learn')
var pointsApi = require('../../api/points')

Page({
  data: {
    _pageEnter: true,
    _isGuest: true,
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
    var app = getApp()
    var loggedIn = app.globalData.isLoggedIn
    this.setData({ _isGuest: !loggedIn })
    if (loggedIn) {
      this.loadHomeData()
    }
    // 游客也加载推荐卡片（公开数据）
    this.loadRecommendedCard()
  },

  onShow() {
    if (this._hasShown) {
      this.setData({ _pageEnter: false }, function () {
        this.setData({ _pageEnter: true })
      })
    } else {
      this._hasShown = true
    }

    var app = getApp()
    var loggedIn = app.globalData.isLoggedIn
    this.setData({ _isGuest: !loggedIn })
    if (loggedIn) {
      this.loadHomeData()
    }
    this.loadRecommendedCard()
  },

  loadHomeData() {
    var self = this

    Promise.all([
      learnApi.getProgress().catch(function () { return {} }),
      learnApi.getReviewToday().catch(function () { return {} }),
      learnApi.getDailyChallenge().catch(function () { return {} }),
      pointsApi.getBalance().catch(function () { return {} })
    ]).then(function (results) {
      var progress = (results[0] && results[0].data) || {}
      var review = (results[1] && results[1].data) || {}
      var challenge = (results[2] && results[2].data) || {}
      var balance = (results[3] && results[3].data) || {}

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

  loadRecommendedCard: function () {
    var self = this
    learnApi.getDomains().then(function (res) {
      var domains = res && res.data
      if (!domains || domains.length === 0) return
      return learnApi.getChapters(domains[0].id)
    }).then(function (res) {
      var chapters = res && res.data
      if (!chapters || chapters.length === 0) return
      return learnApi.getCards(chapters[0].id)
    }).then(function (res) {
      var cards = res && res.data
      if (!cards || cards.length === 0) return
      var card = cards[0]
      var tags = card.tags || []
      var cardId = card.id
      self.setData({
        currentCardId: cardId,
        cardTagText: tags.length > 0 ? tags[0] : '',
        cardTitle: card.title || '',
        cardConcept: card.core_concept || '',
        cardDesc: (card.detail || '').substring(0, 60) + '...',
        tags: tags
      })
      // 查询卡片状态（掌握/收藏）
      learnApi.getCardStatus(cardId).then(function (sr) {
        var st = sr && sr.data
        if (st) {
          self.setData({
            gotItText: st.mastered ? '已掌握' : '懂了',
            saveText: st.favorited ? '已收藏' : '收藏',
          })
        }
      }).catch(function () {})
    }).catch(function () {
      // silently fail
    })
  },

  onBannerTap() {},

  onGuestLoginTap() {
    wx.navigateTo({ url: '/pages/login/login' })
  },

  onReviewTap() {
    wx.navigateTo({ url: '/pages/learn/review-today' })
  },

  onCardGotIt() {
    if (this.data._isGuest) { this._showLoginTip() ; return }
    var self = this
    var cardId = self.data.currentCardId
    if (!cardId) return
    learnApi.masterCard(cardId).then(function () {
      self.setData({ gotItText: '已掌握' })
      wx.showToast({ title: '已掌握 +1 积分', icon: 'success' })
      self.loadHomeData()
    }).catch(function () {
      wx.showToast({ title: '操作失败', icon: 'none' })
    })
  },

  onCardSave() {
    if (this.data._isGuest) { this._showLoginTip() ; return }
    var self = this
    var cardId = self.data.currentCardId
    if (!cardId) return
    learnApi.favoriteCard(cardId).then(function (res) {
      var favorited = res && res.data && res.data.favorited
      self.setData({
        saveText: favorited ? '已收藏' : '收藏'
      })
      wx.showToast({ title: favorited ? '已收藏' : '已取消收藏', icon: 'success' })
    }).catch(function () {
      wx.showToast({ title: '操作失败', icon: 'none' })
    })
  },

  onChallengeStart() {
    if (this.data._isGuest) { this._showLoginTip(); return }
    wx.navigateTo({ url: '/pages/learn/daily-challenge' })
  },

  onQuickNote() {
    if (this.data._isGuest) { this._showLoginTip(); return }
    wx.navigateTo({ url: '/pages/notes/note-editor' })
  },

  onWatchAd() {
    if (this.data._isGuest) { this._showLoginTip(); return }
    var self = this
    pointsApi.adWatch().then(function (res) {
      wx.showToast({ title: '+10 积分', icon: 'success' })
      self.loadHomeData()
    }).catch(function (err) {
      wx.showToast({ title: err.message || '获取积分失败', icon: 'none' })
    })
  },

  _showLoginTip() {
    wx.showToast({ title: '登录后可记录学习进度', icon: 'none' })
  }
})

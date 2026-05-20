Page({
  data: {
    _pageEnter: true,
    navTitle: '码上启航',
    bannerText: '新知识领域上线！',
    ringPercent: '42%',
    statLine1: '今日已学 5/12 张卡片',
    statLine2: '继续加油！保持学习节奏',
    reviewTitle: '今日复习',
    reviewSub: '待复习 8 张卡片',
    reviewBadgeNum: '8',
    sectionLabel: '推荐知识卡片',
    cardTagText: 'K01 编程基础',
    cardTitle: '什么是变量？',
    cardConcept: '变量是存储数据的命名容器，就像贴了标签的盒子',
    cardDesc: '在编程中，变量用于存储和操作数据。你可以把它理解为一个个贴了标签的盒子，每个盒子可以存放不同类型的数据。',
    tags: [
      { text: '数据类型' },
      { text: '存储' }
    ],
    gotItText: '懂了',
    saveText: '收藏',
    challengeTitle: '每日挑战',
    challengeSub: '已连续打卡 7 天',
    challengeBtnText: '开始',
    notesPlaceholder: '快速创建笔记...',
    pointsEmoji: '⭐',
    pointsAmount: '积分余额: 168',
    pointsAdText: '看广告 +10'
  },

  onLoad() {},

  onShow() {
    if (this._hasShown) {
      this.setData({ _pageEnter: false }, function () {
        this.setData({ _pageEnter: true })
      })
    } else {
      this._hasShown = true
    }
  },

  onBannerTap() {},

  onReviewTap() {
    wx.navigateTo({ url: '/pages/learn/review-today/review-today' })
  },

  onCardGotIt() {},

  onCardSave() {},

  onChallengeStart() {
    wx.navigateTo({ url: '/pages/learn/daily-challenge/daily-challenge' })
  },

  onQuickNote() {
    wx.navigateTo({ url: '/pages/notes/note-editor/note-editor' })
  },

  onWatchAd() {}
})
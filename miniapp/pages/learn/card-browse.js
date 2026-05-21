var learnApi = require('../../api/learn')

Page({
  data: {
    _loading: true,
    chapterId: null,
    chapterName: '',
    cards: [],
    filteredCards: [],
    searchKeyword: '',
    statusBarHeight: 0
  },

  onLoad(options) {
    var chapterId = options.chapter_id
    var chapterName = options.chapter_name || ''
    if (chapterName) {
      chapterName = decodeURIComponent(chapterName)
    }
    this.setData({
      chapterId: chapterId,
      chapterName: chapterName
    }, function () {
      this.fetchCards()
    })
  },

  fetchCards() {
    var that = this
    this.setData({ _loading: true })

    learnApi.getCards(this.data.chapterId).then(function (res) {
      var cards = res.data || []
      that.setData({
        cards: cards,
        filteredCards: that.filterCards(cards, that.data.searchKeyword),
        _loading: false
      })
    }).catch(function () {
      that.setData({ _loading: false })
    })
  },

  filterCards(cards, keyword) {
    if (!keyword) return cards
    var kw = keyword.toLowerCase()
    return cards.filter(function (card) {
      return (card.title && card.title.toLowerCase().indexOf(kw) !== -1) ||
             (card.concept && card.concept.toLowerCase().indexOf(kw) !== -1) ||
             (card.tags && card.tags.some(function (t) { return t.toLowerCase().indexOf(kw) !== -1 }))
    })
  },

  onSearch(e) {
    var keyword = e.detail.value || ''
    var filtered = this.filterCards(this.data.cards, keyword)
    this.setData({
      searchKeyword: keyword,
      filteredCards: filtered
    })
  },

  onSearchInput(e) {
    var keyword = e.detail.value || ''
    var filtered = this.filterCards(this.data.cards, keyword)
    this.setData({
      searchKeyword: keyword,
      filteredCards: filtered
    })
  },

  onSearchClear() {
    this.setData({
      searchKeyword: '',
      filteredCards: this.data.cards
    })
  },

  onCardTap(e) {
    var cardId = e.currentTarget.dataset.cardId
    wx.navigateTo({
      url: '/pages/learn/card-detail/card-detail?card_id=' + cardId
    })
  },

  onCardLongPress(e) {
    var cardId = e.currentTarget.dataset.cardId
    var card = this.data.cards.find(function (c) { return c.id == cardId })
    if (!card) return

    var that = this
    wx.showActionSheet({
      itemList: [card.favorited ? '取消收藏' : '收藏卡片'],
      success: function (res) {
        if (res.tapIndex === 0) {
          that.toggleFavorite(card)
        }
      }
    })
  },

  toggleFavorite(card) {
    var that = this
    learnApi.favoriteCard(card.id).then(function () {
      var cards = that.data.cards.map(function (c) {
        if (c.id === card.id) {
          c.favorited = !c.favorited
        }
        return c
      })
      that.setData({
        cards: cards,
        filteredCards: that.filterCards(cards, that.data.searchKeyword)
      })
      wx.showToast({
        title: card.favorited ? '已取消收藏' : '已收藏',
        icon: 'success'
      })
    }).catch(function () {
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      })
    })
  },

  onNavigateBack() {
    wx.navigateBack()
  }
})

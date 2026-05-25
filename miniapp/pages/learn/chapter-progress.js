var learnApi = require('../../api/learn')

Page({
  data: {
    labels: [],
    currentChapterId: null,
    currentChapterName: '',
    loading: true
  },

  onLoad(options) {
    var chapterId = options.chapter_id || ''
    var chapterName = options.chapter_name || '章节进度'
    this.setData({ currentChapterId: chapterId, currentChapterName: chapterName })

    if (chapterId) {
      this.fetchProgress()
    } else {
      this.setData({ loading: false })
    }
  },

  fetchProgress() {
    var self = this
    learnApi.getProgress().then(function (res) {
      var pages = getCurrentPages()
      var prevPage = pages[pages.length - 2]
      var cards = []
      if (prevPage && prevPage.data && prevPage.data.cards) {
        cards = prevPage.data.cards
      }

      var totalCards = cards.length || 0
      var masteredCards = 0
      var learningCards = 0
      for (var i = 0; i < cards.length; i++) {
        if (cards[i].learn_status === 'mastered') masteredCards++
        else if (cards[i].learn_status === 'learning') learningCards++
      }

      var masterPct = totalCards > 0 ? Math.round(masteredCards / totalCards * 100) : 0

      self.setData({
        labels: [
          { name: '总卡片', value: totalCards, unit: '张' },
          { name: '已掌握', value: masteredCards, unit: '张', color: 'var(--color-success)' },
          { name: '学习中', value: learningCards, unit: '张', color: 'var(--color-primary)' },
          { name: '掌握率', value: masterPct, unit: '%', color: masterPct > 50 ? 'var(--color-success)' : 'var(--color-warning)' }
        ],
        loading: false
      })
    }).catch(function () {
      self.setData({ loading: false })
    })
  }
})

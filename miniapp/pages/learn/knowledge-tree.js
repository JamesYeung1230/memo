var learnApi = require('../../api/learn')

Page({
  data: {
    _loading: true,
    domains: [],
    expandedDomainId: null,
    statusBarHeight: 0
  },

  onLoad() {
    var info = wx.getSystemInfoSync()
    this.setData({ statusBarHeight: info.statusBarHeight }, function () {
      this.fetchDomains()
    })
  },

  onShow() {
    if (!this.data._loading) {
      this.refreshData()
    }
  },

  refreshData() {
    var that = this
    learnApi.getDomains().then(function (res) {
      var domains = res.data || []
      that.setData({ domains: domains })
    }).catch(function () {})
  },

  fetchDomains() {
    var that = this
    this.setData({ _loading: true })

    learnApi.getDomains().then(function (res) {
      var domains = res.data || []
      if (domains.length === 0) {
        that.setData({ _loading: false, domains: [] })
        return
      }

      // 逐个获取每个领域的章节
      var fetchChapters = domains.map(function (domain) {
        return learnApi.getChapters(domain.id).then(function (chRes) {
          domain.chapters = chRes.data || []
          domain.chapterCount = domain.chapters.length
          return domain
        }).catch(function () {
          domain.chapters = []
          domain.chapterCount = 0
          return domain
        })
      })

      return Promise.all(fetchChapters)
    }).then(function (domains) {
      that.setData({
        domains: domains,
        _loading: false
      })
    }).catch(function () {
      that.setData({ _loading: false })
    })
  },

  onDomainTap(e) {
    var domainId = e.currentTarget.dataset.domainId
    var expanded = this.data.expandedDomainId

    if (expanded === domainId) {
      this.setData({ expandedDomainId: null })
    } else {
      this.setData({ expandedDomainId: domainId })
    }
  },

  onChapterTap(e) {
    var chapterId = e.currentTarget.dataset.chapterId
    var chapterName = e.currentTarget.dataset.chapterName
    wx.navigateTo({
      url: '/pages/learn/card-browse/card-browse?chapter_id=' + chapterId + '&chapter_name=' + encodeURIComponent(chapterName)
    })
  },

  onDomainProgressTap(e) {
    var domainId = e.currentTarget.dataset.domainId
    var domainName = e.currentTarget.dataset.domainName
    wx.navigateTo({
      url: '/pages/learn/chapter-progress/chapter-progress?domain_id=' + domainId + '&domain_name=' + encodeURIComponent(domainName)
    })
  },

  onQuizTap(e) {
    var domainId = e.currentTarget.dataset.domainId
    wx.navigateTo({
      url: '/pages/learn/quiz/quiz?domain_id=' + domainId
    })
  }
})

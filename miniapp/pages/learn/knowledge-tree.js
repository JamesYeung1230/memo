var learnApi = require('../../api/learn')

Page({
  data: {
    _loading: true,
    domains: [],
    expandedDomainId: null,
    statusBarHeight: 0
  },

  onLoad(options) {
    var info = wx.getSystemInfoSync()
    var activeDomainId = options.domain_id || ''
    var activeDomainName = options.domain_name || ''
    this.setData({
      statusBarHeight: info.statusBarHeight,
      activeDomainId: activeDomainId,
      activeDomainName: activeDomainName
    }, function () {
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
      var filteredDomains = domains
      if (that.data.activeDomainId) {
        for (var i = 0; i < domains.length; i++) {
          if (domains[i].id === that.data.activeDomainId) {
            filteredDomains = [domains[i]]
            break
          }
        }
      }
      that.setData({ domains: filteredDomains })
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
      // 如果指定了活跃领域，只保留该领域，否则显示全部
      var filteredDomains = domains
      var expandedId = null
      if (that.data.activeDomainId) {
        var found = false
        for (var i = 0; i < domains.length; i++) {
          if (domains[i].id === that.data.activeDomainId) {
            filteredDomains = [domains[i]]
            expandedId = domains[i].id
            found = true
            break
          }
        }
        if (!found) {
          filteredDomains = domains
        }
      }
      that.setData({
        domains: filteredDomains,
        expandedDomainId: expandedId,
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
      url: '/pages/learn/card-browse?chapter_id=' + chapterId + '&chapter_name=' + encodeURIComponent(chapterName)
    })
  },

  onDomainProgressTap(e) {
    var domainId = e.currentTarget.dataset.domainId
    var domainName = e.currentTarget.dataset.domainName
    wx.navigateTo({
      url: '/pages/learn/chapter-progress?domain_id=' + domainId + '&domain_name=' + encodeURIComponent(domainName)
    })
  },

  onQuizTap(e) {
    var domainId = e.currentTarget.dataset.domainId
    wx.navigateTo({
      url: '/pages/learn/quiz?domain_id=' + domainId
    })
  }
})

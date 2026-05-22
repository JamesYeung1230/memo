const TABS = [
  { key: 'home', icon: '⌂', label: '首页', path: '/pages/home/home' },
  { key: 'learn', icon: '📖', label: '学习', path: '/pages/learn/learn' },
  { key: 'notes', icon: '📝', label: '笔记', path: '/pages/notes/notes' },
  { key: 'points', icon: '⭐', label: '积分', path: '/pages/points/points' },
  { key: 'profile', icon: '👤', label: '我的', path: '/pages/profile/profile' }
]

Component({
  data: {
    tabs: TABS,
    activeKey: 'home',
    indicatorLeft: 0,
    indicatorWidth: 0
  },

  lifetimes: {
    attached() {
      this.updateActive(false)
    },
    ready() {
      this.slideIndicator(this.data.activeKey)
    }
  },

  pageLifetimes: {
    show() {
      this.updateActive(true)
    }
  },

  methods: {
    updateActive(shouldSlide) {
      var pages = getCurrentPages()
      if (pages.length === 0) return
      var currentPath = '/' + pages[pages.length - 1].route
      var active = null
      for (var i = 0; i < TABS.length; i++) {
        if (TABS[i].path === currentPath) {
          active = TABS[i]
          break
        }
      }
      if (active && active.key !== this.data.activeKey) {
        this.setData({ activeKey: active.key })
        if (shouldSlide) {
          this.slideIndicator(active.key)
        }
      }
    },

    slideIndicator(key) {
      var index = -1
      for (var i = 0; i < TABS.length; i++) {
        if (TABS[i].key === key) { index = i; break }
      }
      if (index === -1) return

      var self = this
      var query = wx.createSelectorQuery().in(this)
      query.select('.tab-bar-pill').boundingClientRect()
      query.selectAll('.tab-item').boundingClientRect()
      query.exec(function (res) {
        var pillRect = res[0]
        var tabRects = res[1]
        if (!pillRect || !tabRects || !tabRects[index]) return
        self.setData({
          indicatorLeft: tabRects[index].left - pillRect.left - 1,
          indicatorWidth: tabRects[index].width
        })
      })
    },

    onTabTap(e) {
      var key = e.currentTarget.dataset.key
      var tab = null
      for (var i = 0; i < TABS.length; i++) {
        if (TABS[i].key === key) { tab = TABS[i]; break }
      }
      if (!tab || key === this.data.activeKey) return
      this.setData({ activeKey: key })
      this.slideIndicator(key)
      wx.switchTab({ url: tab.path })
    }
  }
})

const TABS = [
  { key: 'home', label: '首页', icon: '⌂', path: '/pages/home/home' },
  { key: 'learn', label: '学习', icon: '📖', path: '/pages/learn/learn' },
  { key: 'notes', label: '笔记', icon: '📝', path: '/pages/notes/notes' },
  { key: 'points', label: '积分', icon: '⭐', path: '/pages/points/points' },
  { key: 'profile', label: '我的', icon: '👤', path: '/pages/profile/profile' }
]

Component({
  properties: {},

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
      const pages = getCurrentPages()
      if (pages.length === 0) return
      const currentPath = '/' + pages[pages.length - 1].route
      const active = TABS.find(function (t) { return t.path === currentPath })
      if (active && active.key !== this.data.activeKey) {
        this.setData({ activeKey: active.key })
        if (shouldSlide) {
          this.slideIndicator(active.key)
        }
      }
    },

    slideIndicator(key) {
      const index = TABS.findIndex(function (t) { return t.key === key })
      if (index === -1) return

      const query = wx.createSelectorQuery().in(this)
      query.select('.tab-bar-pill').boundingClientRect()
      query.selectAll('.tab-item').boundingClientRect()
      query.exec(function (res) {
        const pillRect = res[0]
        const tabRects = res[1]
        if (!pillRect || !tabRects || !tabRects[index]) return
        const borderWidth = 1
        this.setData({
          indicatorLeft: tabRects[index].left - pillRect.left - borderWidth,
          indicatorWidth: tabRects[index].width
        })
      }.bind(this))
    },

    onTabTap(e) {
      const key = e.currentTarget.dataset.key
      const tab = TABS.find(function (t) { return t.key === key })
      if (!tab || key === this.data.activeKey) return
      this.setData({ activeKey: key })
      this.slideIndicator(key)
      wx.switchTab({ url: tab.path })
    }
  }
})

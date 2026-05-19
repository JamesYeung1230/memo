const TABS = [
  { key: 'home', label: '首页', icon: '🏠', path: '/pages/home/home' },
  { key: 'learn', label: '学习', icon: '📚', path: '/pages/learn/learn' },
  { key: 'notes', label: '笔记', icon: '📝', path: '/pages/notes/notes' },
  { key: 'points', label: '积分', icon: '⭐', path: '/pages/points/points' },
  { key: 'profile', label: '我的', icon: '👤', path: '/pages/profile/profile' }
]

Component({
  properties: {},

  data: {
    tabs: TABS,
    activeKey: 'home'
  },

  lifetimes: {
    attached() {
      this.updateActive()
    },

    show() {
      this.updateActive()
    }
  },

  methods: {
    updateActive() {
      const pages = getCurrentPages()
      if (pages.length === 0) return
      const currentPath = '/' + pages[pages.length - 1].route
      const active = TABS.find(function (t) { return t.path === currentPath })
      if (active) {
        this.setData({ activeKey: active.key })
      }
    },

    onTabTap(e) {
      const key = e.currentTarget.dataset.key
      const tab = TABS.find(function (t) { return t.key === key })
      if (!tab) return
      if (key === this.data.activeKey) return
      wx.switchTab({ url: tab.path })
    }
  }
})

Component({
  data: {
    list: [
      { pagePath: '/pages/home/home', text: '首页', icon: '⌂', selectedIcon: '⌂' },
      { pagePath: '/pages/learn/learn', text: '学习', icon: '📖', selectedIcon: '📖' },
      { pagePath: '/pages/notes/notes', text: '笔记', icon: '📝', selectedIcon: '📝' },
      { pagePath: '/pages/points/points', text: '积分', icon: '⭐', selectedIcon: '⭐' },
      { pagePath: '/pages/profile/profile', text: '我的', icon: '👤', selectedIcon: '👤' },
    ],
    activeIndex: 0,
  },

  lifetimes: {
    attached() {
      this.updateActiveIndex()
    },
  },

  pageLifetimes: {
    show() {
      this.updateActiveIndex()
    },
  },

  methods: {
    updateActiveIndex() {
      var pages = getCurrentPages()
      if (pages.length === 0) return
      var currentPage = pages[pages.length - 1]
      var route = '/' + currentPage.route
      var list = this.data.list
      for (var i = 0; i < list.length; i++) {
        if (list[i].pagePath === route) {
          this.setData({ activeIndex: i })
          return
        }
      }
    },

    onTabTap(e) {
      var index = e.currentTarget.dataset.index
      var item = this.data.list[index]
      if (!item) return

      wx.switchTab({
        url: item.pagePath,
      })
    },
  },
})

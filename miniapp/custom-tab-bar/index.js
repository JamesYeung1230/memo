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
    indicatorLeft: 0,
    windowWidth: 375,
    pillWidth: 0,
  },

  lifetimes: {
    attached() {
      var info = wx.getSystemInfoSync()
      var ww = info.windowWidth
      // 屏幕宽度(rpx基准750) → pill宽度 = 屏幕宽 - 48rpx边距
      // 在rpx体系中直接算比例
      this.setData({
        windowWidth: ww,
        pillWidth: ww - 48 / 750 * ww,
      })
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
          this.setActiveIndex(i)
          return
        }
      }
    },

    setActiveIndex(index) {
      var ww = this.data.windowWidth
      var rpx = ww / 750
      var pillMargin = 48 * rpx        // 左右各24rpx
      var pillW = ww - pillMargin      // pill总宽(px)
      var pillPad = 6 * rpx            // pill内边距
      var gap = 4 * rpx                // tab间距
      var innerW = pillW - pillPad * 2 - gap * 4  // 5个tab总可用宽度
      var tabW = innerW / 5           // 每个tab宽度
      // indicator左边缘 = pill左内边距 + index * (tab宽 + 间距)
      var left = pillPad + index * (tabW + gap)

      this.setData({
        activeIndex: index,
        indicatorLeft: left,
      })
    },

    onTabTap(e) {
      var index = e.currentTarget.dataset.index
      var item = this.data.list[index]
      if (!item) return

      // 即时更新选中态，不等switchTab完成
      this.setActiveIndex(index)

      wx.switchTab({
        url: item.pagePath,
      })
    },
  },
})

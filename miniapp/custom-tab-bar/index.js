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
    indicatorWidth: 0,
    windowWidth: 375,
  },

  lifetimes: {
    attached() {
      var info = wx.getSystemInfoSync()
      this.setData({ windowWidth: info.windowWidth })
      this.updateActiveIndex()
    },
  },

  pageLifetimes: {
    show() {
      // switchTab后需要等页面栈更新再读取路由
      var that = this
      setTimeout(function () {
        that.updateActiveIndex()
      }, 50)
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
      var that = this
      this.setData({ activeIndex: index })

      // 读取实际DOM位置，确保指示器精确居中
      var query = this.createSelectorQuery()
      query.selectAll('.tab-item').fields({ rect: true }, function (rects) {
        if (!rects || !rects[index]) return

        var ww = that.data.windowWidth
        var rpx = ww / 750

        // 指示器宽度 = tab宽度 - 间距留白4rpx
        var indicatorW = rects[index].width - 4 * rpx
        // tab视口中心坐标
        var tabCenter = rects[index].left + rects[index].width / 2
        // pill的border左边缘 = 第一个tab左边缘 - pill padding(6rpx)
        var pillBorderLeft = rects[0].left - 6 * rpx

        // 指示器left(相对于pill) = tab中心 - 指示器半宽 - pill左边缘
        var left = tabCenter - indicatorW / 2 - pillBorderLeft

        that.setData({
          indicatorLeft: left,
          indicatorWidth: indicatorW,
        })
      }).exec()
    },

    onTabTap(e) {
      var index = e.currentTarget.dataset.index
      var item = this.data.list[index]
      if (!item) return

      // 即时更新，不等switchTab完成
      this.setActiveIndex(index)

      wx.switchTab({
        url: item.pagePath,
      })
    },
  },
})

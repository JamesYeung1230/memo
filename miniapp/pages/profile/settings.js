Page({
  data: {
    _pageEnter: true,
    menuItems: [
      {
        id: 'memory-settings',
        icon: '🧠',
        title: '复习配置',
        subtitle: '日限额、艾宾浩斯节点、遗忘天数',
        url: '/pages/profile/memory-settings'
      },
      {
        id: 'home-settings',
        icon: '🏠',
        title: '首页配置',
        subtitle: '首页模块排序与显示',
        url: '/pages/profile/home-settings'
      },
      {
        id: 'general-settings',
        icon: '⚙️',
        title: '通用设置',
        subtitle: '主题色、清除缓存、关于',
        url: '/pages/profile/general-settings'
      }
    ]
  },

  onLoad() {},

  onShow() {
    if (this._hasShown) {
      this.setData({ _pageEnter: false }, function () {
        this.setData({ _pageEnter: true })
      })
    } else {
      this._hasShown = true
    }
  },

  onMenuTap(e) {
    var url = e.currentTarget.dataset.url
    if (url) {
      wx.navigateTo({ url: url })
    }
  }
})

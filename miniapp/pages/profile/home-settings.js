var app = getApp()

Page({
  data: {
    _pageEnter: true,
    modules: [
      { id: 'domain_tags', name: '领域标签', show: true, visible: true },
      { id: 'overview', name: '学习概览', show: true, visible: true },
      { id: 'quick_actions', name: '快捷操作', show: true, visible: true },
      { id: 'review_today', name: '今日复习', show: true, visible: true },
      { id: 'error_review', name: '错题本', show: true, visible: true },
      { id: 'daily_challenge', name: '每日挑战', show: true, visible: true },
      { id: 'chapter_progress', name: '章节进度', show: true, visible: true }
    ]
  },

  onLoad() {
    this.loadHomeConfig()
  },

  onShow() {
    if (this._hasShown) {
      this.setData({ _pageEnter: false }, function () {
        this.setData({ _pageEnter: true })
      })
    } else {
      this._hasShown = true
    }
  },

  loadHomeConfig() {
    var savedConfig = wx.getStorageSync('homeModuleConfig')
    if (savedConfig) {
      try {
        var parsed = JSON.parse(savedConfig)
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.setData({ modules: parsed })
          return
        }
      } catch (e) {}
    }
  },

  saveHomeConfig() {
    var configStr = JSON.stringify(this.data.modules)
    wx.setStorageSync('homeModuleConfig', configStr)
    wx.showToast({ title: '保存成功', icon: 'success' })
  },

  onModuleToggle(e) {
    var moduleId = e.currentTarget.dataset.moduleId
    var modules = this.data.modules

    for (var i = 0; i < modules.length; i++) {
      if (modules[i].id === moduleId) {
        modules[i].show = !modules[i].show
        break
      }
    }

    this.setData({ modules: modules })
    this.saveHomeConfig()
  },

  onMoveUp(e) {
    var moduleId = e.currentTarget.dataset.moduleId
    var modules = this.data.modules
    var index = -1

    for (var i = 0; i < modules.length; i++) {
      if (modules[i].id === moduleId) {
        index = i
        break
      }
    }

    if (index > 0) {
      var temp = modules[index - 1]
      modules[index - 1] = modules[index]
      modules[index] = temp
      this.setData({ modules: modules })
      this.saveHomeConfig()
    }
  },

  onMoveDown(e) {
    var moduleId = e.currentTarget.dataset.moduleId
    var modules = this.data.modules
    var index = -1

    for (var i = 0; i < modules.length; i++) {
      if (modules[i].id === moduleId) {
        index = i
        break
      }
    }

    if (index < modules.length - 1) {
      var temp = modules[index + 1]
      modules[index + 1] = modules[index]
      modules[index] = temp
      this.setData({ modules: modules })
      this.saveHomeConfig()
    }
  },

  onReset() {
    var that = this
    wx.showModal({
      title: '确认重置',
      content: '将恢复默认首页模块配置，确定重置？',
      success: function (res) {
        if (res.confirm) {
          wx.removeStorageSync('homeModuleConfig')
          that.onLoad()
          wx.showToast({ title: '重置成功', icon: 'success' })
        }
      }
    })
  }
})

var learnApi = require('../../api/learn')

Page({
  data: {
    _loading: true,
    _saving: false,
    dailyLimit: 20,
    forgotDays: 7,
    easyInterval: 1,
    mediumInterval: 3,
    hardInterval: 7,
    silentMode: false,
    enableEbbinghaus: true,
    ebbinghausNodes: [1, 2, 4, 7, 15, 30],
    selectedNodes: [1, 2, 4, 7],
    allNodes: [
      { value: 1, label: '1天' },
      { value: 2, label: '2天' },
      { value: 4, label: '4天' },
      { value: 7, label: '7天' },
      { value: 15, label: '15天' },
      { value: 30, label: '30天' }
    ]
  },

  onLoad() {
    this.fetchConfig()
  },

  fetchConfig() {
    var that = this
    this.setData({ _loading: true })

    learnApi.getReviewConfig().then(function (res) {
      var config = res.data || {}

      that.setData({
        dailyLimit: config.daily_limit || 20,
        forgotDays: config.forgot_days || 7,
        easyInterval: config.easy_interval || 1,
        mediumInterval: config.medium_interval || 3,
        hardInterval: config.hard_interval || 7,
        silentMode: config.silent_mode || false,
        enableEbbinghaus: config.enable_ebbinghaus !== undefined ? config.enable_ebbinghaus : true,
        selectedNodes: config.ebbinghaus_nodes || [1, 2, 4, 7],
        _loading: false
      })
    }).catch(function () {
      that.setData({ _loading: false })
    })
  },

  onDailyLimitChange(e) {
    this.setData({ dailyLimit: e.detail.value })
  },

  onDailyLimitBlur(e) {
    var value = parseInt(e.detail.value, 10)
    if (isNaN(value) || value < 1) value = 1
    if (value > 100) value = 100
    this.setData({ dailyLimit: value })
  },

  onForgotDaysChange(e) {
    this.setData({ forgotDays: e.detail.value })
  },

  onForgotDaysBlur(e) {
    var value = parseInt(e.detail.value, 10)
    if (isNaN(value) || value < 1) value = 1
    if (value > 30) value = 30
    this.setData({ forgotDays: value })
  },

  onEasyIntervalChange(e) {
    this.setData({ easyInterval: parseInt(e.detail.value, 10) || 1 })
  },

  onMediumIntervalChange(e) {
    this.setData({ mediumInterval: parseInt(e.detail.value, 10) || 3 })
  },

  onHardIntervalChange(e) {
    this.setData({ hardInterval: parseInt(e.detail.value, 10) || 7 })
  },

  onEbbinghausToggle() {
    this.setData({
      enableEbbinghaus: !this.data.enableEbbinghaus
    })
  },

  onNodeToggle(e) {
    var nodeValue = e.currentTarget.dataset.value
    var selectedNodes = this.data.selectedNodes
    var index = selectedNodes.indexOf(nodeValue)

    if (index > -1) {
      if (selectedNodes.length <= 1) {
        wx.showToast({ title: '至少选择一个节点', icon: 'none' })
        return
      }
      selectedNodes.splice(index, 1)
    } else {
      selectedNodes.push(nodeValue)
      selectedNodes.sort(function (a, b) { return a - b })
    }

    this.setData({ selectedNodes: selectedNodes })
  },

  onSilentModeToggle() {
    this.setData({ silentMode: !this.data.silentMode })
  },

  onSave() {
    var that = this
    this.setData({ _saving: true })

    var config = {
      daily_limit: this.data.dailyLimit,
      forgot_days: this.data.forgotDays,
      easy_interval: this.data.easyInterval,
      medium_interval: this.data.mediumInterval,
      hard_interval: this.data.hardInterval,
      silent_mode: this.data.silentMode,
      enable_ebbinghaus: this.data.enableEbbinghaus,
      ebbinghaus_nodes: this.data.selectedNodes
    }

    learnApi.updateReviewConfig(config).then(function () {
      wx.showToast({ title: '保存成功', icon: 'success' })
      that.setData({ _saving: false })
      setTimeout(function () {
        wx.navigateBack()
      }, 1200)
    }).catch(function () {
      wx.showToast({ title: '保存失败', icon: 'none' })
      that.setData({ _saving: false })
    })
  },

  onReset() {
    var that = this
    wx.showModal({
      title: '确认重置',
      content: '将恢复出厂默认设置，确定重置？',
      success: function (res) {
        if (res.confirm) {
          learnApi.resetReviewConfig().then(function () {
            wx.showToast({ title: '重置成功', icon: 'success' })
            that.fetchConfig()
          }).catch(function () {
            wx.showToast({ title: '重置失败', icon: 'none' })
          })
        }
      }
    })
  }
})

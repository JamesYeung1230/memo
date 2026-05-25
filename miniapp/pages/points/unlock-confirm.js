var pointsApi = require('../../api/points')

Page({
  data: {
    domainId: '',
    domainName: '',
    pointsCost: 0,
    userBalance: 0,
    balanceAfter: 0,
    canUnlock: false,
    _submitting: false
  },

  onLoad(options) {
    var domainId = options && options.domain_id
    var name = options && options.name
    var pointsCost = parseInt((options && options.points_cost) || '0', 10)

    if (!domainId) {
      wx.showToast({ title: '参数错误', icon: 'none' })
      return
    }

    this.setData({
      domainId: domainId,
      domainName: decodeURIComponent(name || '知识领域'),
      pointsCost: pointsCost
    })

    this.fetchBalance()
  },

  onShow() {},

  fetchBalance() {
    var that = this
    pointsApi.getBalance().then(function (res) {
      var balance = (res.data && res.data.balance) || 0
      var cost = that.data.pointsCost
      that.setData({
        userBalance: balance,
        balanceAfter: balance - cost,
        canUnlock: balance >= cost
      })
    }).catch(function () {})
  },

  onCancel() {
    wx.navigateBack()
  },

  onConfirmUnlock() {
    if (this.data._submitting) return
    if (!this.data.canUnlock) {
      wx.showToast({ title: '积分不足', icon: 'none' })
      return
    }

    var that = this
    this.setData({ _submitting: true })

    wx.showLoading({ title: '正在解锁...', mask: true })

    // 调用后端解锁接口
    var request = require('../../utils/request')
    request.post('/points/unlock', {
      domain_id: that.data.domainId,
      points_cost: that.data.pointsCost
    }).then(function (res) {
      wx.hideLoading()
      wx.showToast({ title: '解锁成功！', icon: 'success', duration: 2000 })

      // 返回上一页并刷新
      var pages = getCurrentPages()
      if (pages.length >= 2) {
        var prevPage = pages[pages.length - 2]
        if (prevPage && typeof prevPage.loadData === 'function') {
          prevPage.loadData()
        }
      }
      setTimeout(function () {
        wx.navigateBack()
      }, 1500)
    }).catch(function (err) {
      wx.hideLoading()
      that.setData({ _submitting: false })
      var message = (err && err.message) || '解锁失败，请重试'
      wx.showToast({ title: message, icon: 'none', duration: 2000 })
    })
  }
})

var learnApi = require('../../api/learn')

Page({
  data: {
    _loading: true,
    cardId: null,
    cardDetail: null,
    statusBarHeight: 0
  },

  onLoad(options) {
    var cardId = options.card_id
    this.setData({ cardId: cardId }, function () {
      this.fetchCardDetail()
    })
  },

  fetchCardDetail() {
    var that = this
    this.setData({ _loading: true })

    learnApi.getCardDetail(this.data.cardId).then(function (res) {
      var card = res.data || null
      that.setData({
        cardDetail: card,
        _loading: false
      })
    }).catch(function () {
      that.setData({ _loading: false })
    })
  },

  onMastered(e) {
    var that = this
    var cardId = this.data.cardId

    learnApi.masterCard(cardId).then(function () {
      var card = that.data.cardDetail
      if (card) {
        card.mastered = true
        that.setData({ cardDetail: card })
      }
      wx.showToast({
        title: '已标记为掌握',
        icon: 'success'
      })
    }).catch(function () {
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      })
    })
  },

  onFavorite(e) {
    var that = this

    learnApi.favoriteCard(this.data.cardId).then(function () {
      var card = that.data.cardDetail
      if (card) {
        card.favorited = !card.favorited
        that.setData({ cardDetail: card })
      }
      wx.showToast({
        title: card.favorited ? '已收藏' : '已取消收藏',
        icon: 'success'
      })
    }).catch(function () {
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      })
    })
  },

  onShareCard() {
    var that = this
    var card = this.data.cardDetail
    if (!card) return

    // 创建 canvas 分享图
    var query = wx.createSelectorQuery()
    query.select('.card-detail-wrapper').boundingClientRect()
    query.exec(function (res) {
      if (!res || !res[0]) {
        // 降级：直接使用系统分享
        wx.showActionSheet({
          itemList: ['分享给朋友', '生成图片'],
          success: function (res) {
            if (res.tapIndex === 1) {
              that.generateShareImage(card)
            }
          }
        })
        return
      }
      that.generateShareImage(card)
    })
  },

  generateShareImage(card) {
    var that = this
    wx.showLoading({
      title: '生成中...',
      mask: true
    })

    // 使用 canvas 2d API 生成分享图
    var query = wx.createSelectorQuery()
    query.select('#share-canvas').fields({ node: true, size: true }).exec(function (res) {
      if (!res || !res[0] || !res[0].node) {
        wx.hideLoading()
        // 兜底：提示用户截图
        wx.showToast({
          title: '请使用截图分享',
          icon: 'none'
        })
        return
      }

      var canvas = res[0].node
      var ctx = canvas.getContext('2d')

      // 设置 canvas 尺寸
      var dpr = wx.getSystemInfoSync().pixelRatio
      canvas.width = 600 * dpr
      canvas.height = 800 * dpr
      ctx.scale(dpr, dpr)

      // 绘制背景
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, 600, 800)

      // 绘制标题
      ctx.fillStyle = '#1E293B'
      ctx.font = 'bold 28px sans-serif'
      ctx.textBaseline = 'top'
      that.wrapText(ctx, card.title || '', 40, 40, 520, 28)

      // 绘制分割线
      ctx.strokeStyle = '#E2E8F0'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(40, 120)
      ctx.lineTo(560, 120)
      ctx.stroke()

      // 绘制核心概念
      ctx.fillStyle = '#4A90D9'
      ctx.font = 'bold 20px sans-serif'
      ctx.fillText('核心概念', 40, 150)

      ctx.fillStyle = '#64748B'
      ctx.font = '18px sans-serif'
      var conceptY = that.wrapText(ctx, card.concept || '', 40, 185, 520, 22)
      if (typeof conceptY === 'number') {
        conceptY = conceptY + 20
      } else {
        conceptY = 210
      }

      // 绘制详情
      if (card.description) {
        ctx.fillStyle = '#4A90D9'
        ctx.font = 'bold 20px sans-serif'
        ctx.fillText('详细说明', 40, conceptY + 10)

        ctx.fillStyle = '#64748B'
        ctx.font = '16px sans-serif'
        var descY = that.wrapText(ctx, card.description.replace(/<[^>]+>/g, ''), 40, conceptY + 45, 520, 20)
        if (typeof descY === 'number') {
          descY = descY + 10
        } else {
          descY = conceptY + 90
        }
      }

      wx.hideLoading()

      // 保存到相册
      wx.canvasToTempFilePath({
        canvas: canvas,
        success: function (res) {
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: function () {
              wx.showToast({
                title: '已保存到相册',
                icon: 'success'
              })
            },
            fail: function () {
              wx.showToast({
                title: '保存失败',
                icon: 'none'
              })
            }
          })
        },
        fail: function () {
          wx.showToast({
            title: '生成图片失败',
            icon: 'none'
          })
        }
      })
    })
  },

  // Canvas 文本换行工具
  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    if (!text) return y
    var chars = text.split('')
    var line = ''
    var currentY = y

    for (var i = 0; i < chars.length; i++) {
      var char = chars[i]
      var testLine = line + char
      var metrics = ctx.measureText(testLine)

      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line, x, currentY)
        line = char
        currentY += lineHeight
      } else {
        line = testLine
      }
    }

    ctx.fillText(line, x, currentY)
    return currentY + lineHeight
  },

  onShareAppMessage() {
    var card = this.data.cardDetail
    if (!card) return {}
    return {
      title: '知识卡片：' + (card.title || ''),
      path: '/pages/learn/card-detail?card_id=' + this.data.cardId
    }
  }
})

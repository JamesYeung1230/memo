/**
 * 笔记分享预览页
 *
 * 功能：展示分享卡片预览 + 调用微信原生分享
 * 从 options 接收 note_id
 */

var api = require('../../api/notes')

Page({
  data: {
    loading: true,
    noteId: null,
    shareTitle: '',
    sharePreview: '',
    tags: [],
    cardData: null
  },

  onLoad: function (options) {
    var noteId = options.note_id
    if (!noteId) {
      wx.showToast({ title: '参数错误', icon: 'none' })
      setTimeout(function () {
        wx.navigateBack({ delta: 1 })
      }, 1000)
      return
    }
    this.setData({ noteId: noteId })
    this.loadShareCard(noteId)
  },

  onShow: function () {},

  /**
   * 加载分享卡片内容
   */
  loadShareCard: function (noteId) {
    var that = this
    this.setData({ loading: true })

    api.shareCard(noteId).then(function (res) {
      var data = res.data || {}

      var title = (data.title || '笔记分享')
      var content = (data.content || '')
      var tags = data.tags || []

      // 截取标题前20字
      var shareTitle = title.length > 20 ? title.substring(0, 20) + '...' : title

      // 截取内容前50字
      var sharePreview = content.length > 50 ? content.substring(0, 50) + '...' : content

      that.setData({
        loading: false,
        cardData: data,
        shareTitle: shareTitle,
        sharePreview: sharePreview,
        tags: tags
      })
    }).catch(function (err) {
      that.setData({ loading: false })
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
    })
  },

  /**
   * 转发/分享
   */
  onShareAppMessage: function () {
    var noteId = this.data.noteId
    var title = this.data.shareTitle || '笔记分享'

    return {
      title: title,
      path: '/pages/notes/note-detail/note-detail?note_id=' + noteId
    }
  },

  /**
   * 生成分享图片（调用后端生成的分享图）
   */
  onShare: function () {
    var cardData = this.data.cardData
    if (!cardData || !cardData.share_image_url) {
      // 如果没有后端生成的分享图，直接使用转发
      wx.showToast({ title: '点击右上角 ... 转发', icon: 'none' })
      return
    }

    var that = this
    wx.showLoading({ title: '生成中...' })

    // 下载分享图片到本地
    wx.downloadFile({
      url: cardData.share_image_url,
      success: function (res) {
        wx.hideLoading()
        if (res.statusCode === 200) {
          // 保存到相册
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: function () {
              wx.showToast({ title: '已保存到相册', icon: 'success' })
            },
            fail: function () {
              wx.showToast({ title: '保存失败', icon: 'none' })
            }
          })
        } else {
          wx.showToast({ title: '图片下载失败', icon: 'none' })
        }
      },
      fail: function () {
        wx.hideLoading()
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  }
})

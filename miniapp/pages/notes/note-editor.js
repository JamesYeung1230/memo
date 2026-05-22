/**
 * 笔记编辑器页
 *
 * 功能：创建新笔记 / 编辑已有笔记
 * 从 options 接收 note_id 表示编辑模式，否则创建模式
 */

var api = require('../../api/notes')

Page({
  data: {
    noteId: null,
    isEdit: false,
    title: '',
    content: '',
    tags: '',
    cardId: '',
    submitting: false,
    titleError: false,
    contentError: false
  },

  onLoad: function (options) {
    this.setData({ statusBarHeight: wx.getSystemInfoSync().statusBarHeight })

    var noteId = options.note_id
    if (noteId) {
      this.setData({ noteId: noteId, isEdit: true })
      this.loadNoteDetail(noteId)
    }
  },

  onShow: function () {},

  /**
   * 加载笔记详情（编辑模式）
   */
  loadNoteDetail: function (noteId) {
    var that = this
    wx.showLoading({ title: '加载中...' })

    api.getNote(noteId).then(function (res) {
      wx.hideLoading()
      var note = res.data || {}
      that.setData({
        title: note.title || '',
        content: note.content || '',
        tags: (note.tags || []).join(', '),
        cardId: note.card_id || ''
      })
    }).catch(function (err) {
      wx.hideLoading()
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
    })
  },

  /**
   * 标题输入
   */
  onTitleInput: function (e) {
    this.setData({
      title: e.detail.value,
      titleError: false
    })
  },

  /**
   * 内容输入
   */
  onContentInput: function (e) {
    this.setData({
      content: e.detail.value,
      contentError: false
    })
  },

  /**
   * 标签输入
   */
  onTagsInput: function (e) {
    this.setData({ tags: e.detail.value })
  },

  /**
   * 关联卡片 ID 输入
   */
  onCardIdInput: function (e) {
    this.setData({ cardId: e.detail.value })
  },

  /**
   * 提交保存
   */
  onSubmit: function () {
    var that = this
    var title = this.data.title.trim()
    var content = this.data.content.trim()
    var tags = this.data.tags.trim()
    var cardId = this.data.cardId.trim()

    // 表单验证
    var hasError = false
    if (!title) {
      this.setData({ titleError: true })
      hasError = true
    }
    if (!content) {
      this.setData({ contentError: true })
      hasError = true
    }
    if (hasError) {
      wx.showToast({ title: '请填写标题和内容', icon: 'none' })
      return
    }

    var data = {
      title: title,
      content: content
    }

    if (tags) {
      data.tags = tags.split(',').map(function (t) { return t.trim() }).filter(Boolean)
    }
    if (cardId) {
      data.card_id = parseInt(cardId, 10)
    }

    this.setData({ submitting: true })
    wx.showLoading({ title: '保存中...' })

    var request = this.data.isEdit
      ? api.updateNote(this.data.noteId, data)
      : api.createNote(data)

    request.then(function () {
      wx.hideLoading()
      wx.showToast({ title: '保存成功', icon: 'success' })
      that.setData({ submitting: false })
      // 返回上一页
      setTimeout(function () {
        wx.navigateBack({ delta: 1 })
      }, 500)
    }).catch(function (err) {
      wx.hideLoading()
      that.setData({ submitting: false })
      wx.showToast({ title: err.message || '保存失败', icon: 'none' })
    })
  }
})

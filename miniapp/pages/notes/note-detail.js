/**
 * 笔记详情页
 *
 * 功能：展示笔记内容、审核状态、操作按钮
 * 从 options 接收 note_id
 */

var api = require('../../api/notes')

var AUDIT_STATUS_MAP = {
  draft: { label: '草稿', class: 'draft' },
  pending: { label: '审核中', class: 'pending' },
  approved: { label: '已通过', class: 'approved' },
  rejected: { label: '已驳回', class: 'rejected' }
}

Page({
  data: {
    note: null,
    loading: true,
    statusLabel: '',
    statusClass: '',
    canSubmitReview: false,
    canWithdrawReview: false,
    canEdit: false,
    showDeleteConfirm: false
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
    this.loadNoteDetail(noteId)
  },

  onShow: function () {},

  /**
   * 加载笔记详情
   */
  loadNoteDetail: function (noteId) {
    var that = this
    this.setData({ loading: true })

    api.getNote(noteId).then(function (res) {
      var note = res.data || {}
      var status = AUDIT_STATUS_MAP[note.audit_status] || { label: '未知', class: '' }

      that.setData({
        note: note,
        loading: false,
        statusLabel: status.label,
        statusClass: status.class,
        canSubmitReview: note.audit_status === 'draft',
        canWithdrawReview: note.audit_status === 'pending',
        canEdit: note.audit_status === 'draft' || note.audit_status === 'rejected'
      })
    }).catch(function (err) {
      that.setData({ loading: false })
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
    })
  },

  /**
   * 编辑笔记
   */
  onEdit: function () {
    var noteId = this.data.noteId
    wx.navigateTo({ url: '/pages/notes/note-editor?note_id=' + noteId })
  },

  /**
   * 提交审核
   */
  onSubmitReview: function () {
    var that = this
    wx.showModal({
      title: '提交审核',
      content: '确定提交此笔记进行审核吗？',
      success: function (res) {
        if (res.confirm) {
          that.doSubmitReview()
        }
      }
    })
  },

  doSubmitReview: function () {
    var that = this
    wx.showLoading({ title: '提交中...' })

    api.submitReview(this.data.noteId).then(function () {
      wx.hideLoading()
      wx.showToast({ title: '提交成功', icon: 'success' })
      that.loadNoteDetail(that.data.noteId)
    }).catch(function (err) {
      wx.hideLoading()
      wx.showToast({ title: err.message || '提交失败', icon: 'none' })
    })
  },

  /**
   * 撤回审核
   */
  onWithdrawReview: function () {
    var that = this
    wx.showModal({
      title: '撤回审核',
      content: '确定撤回此笔记的审核申请吗？',
      success: function (res) {
        if (res.confirm) {
          that.doWithdrawReview()
        }
      }
    })
  },

  doWithdrawReview: function () {
    var that = this
    wx.showLoading({ title: '撤回中...' })

    api.withdrawReview(this.data.noteId).then(function () {
      wx.hideLoading()
      wx.showToast({ title: '撤回成功', icon: 'success' })
      that.loadNoteDetail(that.data.noteId)
    }).catch(function (err) {
      wx.hideLoading()
      wx.showToast({ title: err.message || '撤回失败', icon: 'none' })
    })
  },

  /**
   * 删除笔记
   */
  onDelete: function () {
    var that = this
    wx.showModal({
      title: '删除笔记',
      content: '确定删除此笔记吗？此操作不可撤销。',
      confirmText: '删除',
      confirmColor: '#EF4444',
      success: function (res) {
        if (res.confirm) {
          that.doDelete()
        }
      }
    })
  },

  doDelete: function () {
    var that = this
    wx.showLoading({ title: '删除中...' })

    api.deleteNote(this.data.noteId).then(function () {
      wx.hideLoading()
      wx.showToast({ title: '删除成功', icon: 'success' })
      setTimeout(function () {
        wx.navigateBack({ delta: 1 })
      }, 500)
    }).catch(function (err) {
      wx.hideLoading()
      wx.showToast({ title: err.message || '删除失败', icon: 'none' })
    })
  },

  /**
   * 分享笔记
   */
  onShare: function () {
    var noteId = this.data.noteId
    wx.navigateTo({ url: '/pages/notes/note-share/note-share?note_id=' + noteId })
  },

  /**
   * 格式化时间
   */
  formatTime: function (timeStr) {
    if (!timeStr) return ''
    try {
      var date = new Date(timeStr)
      var month = (date.getMonth() + 1).toString().padStart(2, '0')
      var day = date.getDate().toString().padStart(2, '0')
      var h = date.getHours().toString().padStart(2, '0')
      var m = date.getMinutes().toString().padStart(2, '0')
      return date.getFullYear() + '-' + month + '-' + day + ' ' + h + ':' + m
    } catch (e) {
      return timeStr
    }
  }
})

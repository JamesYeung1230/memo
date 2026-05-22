var notesApi = require('../../api/notes')

Page({
  data: {
    _loading: true,
    audits: [],
    totalCount: 0,
    currentPage: 1
  },

  onLoad() {
    this.fetchAuditHistory()
  },

  onShow() {
    if (this._hasShown) {
      this.fetchAuditHistory()
    } else {
      this._hasShown = true
    }
  },

  fetchAuditHistory() {
    var that = this
    this.setData({ _loading: true })

    // 先获取审核状态选项
    notesApi.getAuditStatus().then(function (statusRes) {
      var statusOptions = statusRes.data || {}

      // 再获取笔记列表（包含审核状态）
      notesApi.listNotes({ page: that.data.currentPage, page_size: 20 }).then(function (res) {
        var notes = res.data || []
        var totalCount = (res.meta && res.meta.total) || notes.length

        // 过滤有审核状态的笔记，或显示所有笔记
        var audits = []
        for (var i = 0; i < notes.length; i++) {
          var note = notes[i]
          audits.push({
            id: note.id,
            title: note.title || '无标题',
            content: note.content || '',
            auditStatus: note.audit_status || note.status || 'pending',
            auditRemark: note.audit_remark || '',
            submitTime: note.submit_time || note.created_at || '',
            auditTime: note.audit_time || '',
            tags: note.tags || []
          })
        }

        that.setData({
          audits: audits,
          totalCount: totalCount,
          _loading: false
        })
      }).catch(function () {
        that.setData({ _loading: false })
      })
    }).catch(function () {
      // 如果获取状态选项失败，直接获取笔记列表
      notesApi.listNotes({ page: that.data.currentPage, page_size: 20 }).then(function (res) {
        var notes = res.data || []
        var totalCount = (res.meta && res.meta.total) || notes.length

        var audits = []
        for (var i = 0; i < notes.length; i++) {
          var note = notes[i]
          audits.push({
            id: note.id,
            title: note.title || '无标题',
            content: note.content || '',
            auditStatus: note.audit_status || note.status || 'pending',
            auditRemark: note.audit_remark || '',
            submitTime: note.submit_time || note.created_at || '',
            auditTime: note.audit_time || '',
            tags: note.tags || []
          })
        }

        that.setData({
          audits: audits,
          totalCount: totalCount,
          _loading: false
        })
      }).catch(function () {
        that.setData({ _loading: false })
      })
    })
  },

  onAuditStatus(e) {
    var status = e.currentTarget.dataset.status
    if (status) {
      var statusLabels = {
        pending: '待审核',
        approved: '已通过',
        rejected: '已驳回',
        draft: '草稿'
      }
      wx.showToast({ title: statusLabels[status] || status, icon: 'none' })
    }
  },

  onNoteTap(e) {
    var noteId = e.currentTarget.dataset.noteId
    if (noteId) {
      wx.navigateTo({
        url: '/pages/notes/note-detail?note_id=' + noteId
      })
    }
  },

  onRefresh() {
    this.fetchAuditHistory()
  }
})

/**
 * 笔记列表页
 *
 * 功能：搜索 + 审核状态筛选 + 分页列表 + 新建笔记
 */

var api = require('../../api/notes')

var FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'draft', label: '草稿' },
  { key: 'submitted', label: '审核中' },
  { key: 'approved', label: '已通过' },
  { key: 'rejected', label: '已驳回' }
]

var AUDIT_STATUS_MAP = {
  draft: { label: '草稿', class: 'draft' },
  submitted: { label: '审核中', class: 'pending' },
  approved: { label: '已通过', class: 'approved' },
  rejected: { label: '已驳回', class: 'rejected' }
}

var searchTimer = null
var PAGE_SIZE = 20

Page({
  data: {
    _pageEnter: true,
    statusBarHeight: 0,
    notes: [],
    filters: FILTERS,
    activeFilter: 'all',
    searchKeyword: '',
    loading: false,
    loadingMore: false,
    hasMore: true,
    page: 1,
    showEmpty: false
  },

  onLoad() {
    var info = wx.getSystemInfoSync()
    this.setData({ statusBarHeight: info.statusBarHeight })
    this.loadNotes()
  },

  onShow() {
    // 每次页面显示刷新列表（从编辑页返回时）
    this.setData({
      page: 1,
      notes: [],
      hasMore: true,
      showEmpty: false
    })
    this.loadNotes()

    if (this._hasShown) {
      this.setData({ _pageEnter: false }, function () {
        this.setData({ _pageEnter: true })
      })
    } else {
      this._hasShown = true
    }
  },

  /**
   * 加载笔记列表
   */
  loadNotes: function (isLoadMore) {
    var that = this
    var page = isLoadMore ? this.data.page : 1

    if (isLoadMore) {
      this.setData({ loadingMore: true })
    } else {
      this.setData({ loading: true })
    }

    var params = {
      page: page,
      page_size: PAGE_SIZE
    }

    if (this.data.searchKeyword) {
      params.keyword = this.data.searchKeyword
    }

    if (this.data.activeFilter !== 'all') {
      params.audit_status = this.data.activeFilter
    }

    api.listNotes(params).then(function (res) {
      var items = res.data || []
      var total = (res.meta && res.meta.total) || 0

      var formattedItems = items.map(function (item) {
        return that.formatNoteItem(item)
      })

      if (isLoadMore) {
        that.setData({
          notes: that.data.notes.concat(formattedItems),
          loadingMore: false,
          hasMore: that.data.notes.length + formattedItems.length < total,
          page: page + 1
        })
      } else {
        that.setData({
          notes: formattedItems,
          loading: false,
          hasMore: formattedItems.length < total,
          page: page + 1,
          showEmpty: formattedItems.length === 0
        })
      }
    }).catch(function (err) {
      that.setData({
        loading: false,
        loadingMore: false,
        showEmpty: that.data.notes.length === 0
      })
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
    })
  },

  /**
   * 格式化笔记项，适配模板渲染
   */
  formatNoteItem: function (item) {
    var status = AUDIT_STATUS_MAP[item.audit_status] || { label: '未知', class: '' }
    var content = item.content || ''
    var preview = content.length > 60 ? content.substring(0, 60) + '...' : content

    return {
      note_id: item.id,
      title: item.title,
      preview: preview,
      time: this.formatTime(item.updated_at || item.created_at),
      statusLabel: status.label,
      statusClass: status.class
    }
  },

  /**
   * 格式化时间
   */
  formatTime: function (timeStr) {
    if (!timeStr) return ''
    try {
      var date = new Date(timeStr)
      var now = new Date()
      var diff = now - date
      var minutes = Math.floor(diff / 60000)
      var hours = Math.floor(diff / 3600000)
      var days = Math.floor(diff / 86400000)

      if (minutes < 1) return '刚刚'
      if (minutes < 60) return minutes + '分钟前'
      if (hours < 24) return hours + '小时前'
      if (days < 7) return days + '天前'

      var month = (date.getMonth() + 1).toString().padStart(2, '0')
      var day = date.getDate().toString().padStart(2, '0')
      var h = date.getHours().toString().padStart(2, '0')
      var m = date.getMinutes().toString().padStart(2, '0')
      return month + '月' + day + '日 ' + h + ':' + m
    } catch (e) {
      return timeStr
    }
  },

  onFilterTap: function (e) {
    var key = e.currentTarget.dataset.key
    if (key === this.data.activeFilter) return
    this.setData({
      activeFilter: key,
      page: 1,
      notes: [],
      hasMore: true,
      showEmpty: false
    })
    this.loadNotes()
  },

  onNoteTap: function (e) {
    var noteId = e.currentTarget.dataset.noteId
    if (!noteId) return
    wx.navigateTo({ url: '/pages/notes/note-detail?note_id=' + noteId })
  },

  onSearchInput: function (e) {
    var value = e.detail.value
    this.setData({ searchKeyword: value })

    // 防抖：连续输入时不频繁请求
    if (searchTimer) clearTimeout(searchTimer)
    var that = this
    searchTimer = setTimeout(function () {
      that.setData({
        page: 1,
        notes: [],
        hasMore: true,
        showEmpty: false
      })
      that.loadNotes()
    }, 400)
  },

  onAddNote: function () {
    wx.navigateTo({ url: '/pages/notes/note-editor' })
  },

  /**
   * 触底加载更多
   */
  onReachBottom: function () {
    if (!this.data.hasMore || this.data.loadingMore) return
    this.loadNotes(true)
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh: function () {
    var that = this
    this.setData({
      page: 1,
      notes: [],
      hasMore: true,
      showEmpty: false
    })
    this.loadNotes()
    // 手动停止下拉刷新（loadNotes 完成后）
    setTimeout(function () {
      wx.stopPullDownRefresh()
    }, 500)
  }
})

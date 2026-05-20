const NOTES = [
  {
    title: 'API 的概念理解',
    preview: 'API就是应用程序接口，像餐厅的菜单...',
    time: '2小时前',
    statusLabel: '审核中',
    statusClass: 'pending'
  },
  {
    title: 'HTTP 和 HTTPS 的区别',
    preview: 'HTTPS多了安全加密层...',
    time: '昨天 16:32',
    statusLabel: '已通过',
    statusClass: 'approved'
  },
  {
    title: '数据库 CRUD 速记',
    preview: 'Create Read Update Delete...',
    time: '3天前',
    statusLabel: '已驳回',
    statusClass: 'rejected'
  }
]

const FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '审核中' },
  { key: 'approved', label: '已通过' }
]

Page({
  data: {
    _pageEnter: true,
    statusBarHeight: 0,
    notes: NOTES,
    filters: FILTERS,
    activeFilter: 'all',
    searchKeyword: ''
  },

  onLoad() {
    const { statusBarHeight } = wx.getSystemInfoSync()
    this.setData({ statusBarHeight })
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

  onFilterTap(e) {
    const key = e.currentTarget.dataset.key
    if (key === this.data.activeFilter) return
    this.setData({ activeFilter: key })
  },

  onNoteTap(e) {
    const index = e.currentTarget.dataset.index
    wx.navigateTo({ url: '/pages/notes/note-detail/note-detail' })
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value })
  },

  onAddNote() {
    wx.navigateTo({ url: '/pages/notes/note-editor/note-editor' })
  }
})
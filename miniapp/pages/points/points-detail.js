var pointsApi = require('../../api/points')

var ACTION_TYPE_MAP = {
  learn_card: '学习知识卡片',
  daily_challenge: '每日挑战',
  checkin_milestone: '签到里程碑',
  create_note: '创建笔记',
  ad_watch: '观看广告',
  unlock_domain: '解锁知识领域',
  unlock_card: '解锁知识卡片',
  exchange_achievement: '兑换成就',
  admin_adjust: '管理员调整'
}

var FILTER_TABS = [
  { key: '', label: '全部' },
  { key: 'learn_card', label: '学习' },
  { key: 'daily_challenge', label: '挑战' },
  { key: 'ad_watch', label: '广告' },
  { key: 'unlock_domain', label: '解锁' }
]

Page({
  data: {
    _loading: true,
    _loadingMore: false,
    _noMore: false,
    records: [],
    filterTabs: FILTER_TABS,
    activeFilterIndex: 0,
    page: 1,
    pageSize: 20
  },

  onLoad() {
    this.loadRecords(1, true)
  },

  onShow() {},

  /**
   * 加载积分记录
   * @param {number} page - 页码
   * @param {boolean} reset - 是否重置列表
   */
  loadRecords(page, reset) {
    var that = this
    var actionType = FILTER_TABS[this.data.activeFilterIndex].key

    if (reset) {
      this.setData({ _loading: true, records: [], page: 1, _noMore: false })
    } else {
      this.setData({ _loadingMore: true })
    }

    pointsApi.getRecords({
      page: page,
      page_size: this.data.pageSize,
      action_type: actionType || undefined
    }).then(function (res) {
      var list = res.data || []
      var meta = res.meta || {}
      var total = meta.total || 0
      var currentPage = meta.page || page

      var formatted = list.map(function (item) {
        var points = item.points || 0
        return {
          id: item.id,
          points: points,
          pointsText: (points > 0 ? '+' : '') + points,
          pointsClass: points >= 0 ? 'points-positive' : 'points-negative',
          balanceAfter: item.balance_after || 0,
          actionType: item.action_type || '',
          actionTypeLabel: ACTION_TYPE_MAP[item.action_type] || item.action_type || '未知',
          description: item.description || '',
          createdAt: that.formatTime(item.created_at)
        }
      })

      var records = reset ? formatted : that.data.records.concat(formatted)
      var noMore = records.length >= total

      that.setData({
        records: records,
        page: currentPage + 1,
        _noMore: noMore,
        _loading: false,
        _loadingMore: false
      })
    }).catch(function () {
      that.setData({
        _loading: false,
        _loadingMore: false
      })
    })
  },

  /**
   * 格式化时间显示
   */
  formatTime(dateStr) {
    if (!dateStr) return ''
    var d = new Date(dateStr)
    var month = String(d.getMonth() + 1).padStart(2, '0')
    var day = String(d.getDate()).padStart(2, '0')
    var hour = String(d.getHours()).padStart(2, '0')
    var min = String(d.getMinutes()).padStart(2, '0')
    return month + '-' + day + ' ' + hour + ':' + min
  },

  /**
   * 切换筛选标签
   */
  onFilterTabTap(e) {
    var index = e.currentTarget.dataset.index
    if (index === this.data.activeFilterIndex) return
    this.setData({ activeFilterIndex: index })
    this.loadRecords(1, true)
  },

  /**
   * 触底加载更多
   */
  onScrollToLower() {
    if (this.data._loadingMore || this.data._noMore) return
    this.loadRecords(this.data.page, false)
  }
})

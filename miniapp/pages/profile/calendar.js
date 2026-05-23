var learnApi = require('../../api/learn')

Page({
  data: {
    _loading: true,
    year: 0,
    month: 0,
    days: [],
    currentStreak: 0,
    totalDays: 0,
    weekLabels: ['日', '一', '二', '三', '四', '五', '六']
  },

  onLoad() {
    var now = new Date()
    this.setData({
      year: now.getFullYear(),
      month: now.getMonth() + 1
    })
    this.loadCalendarData()
  },

  onShow() {
    if (this._hasShown && this.data.month > 0) {
      this.loadCalendarData()
    } else {
      this._hasShown = true
    }
  },

  /**
   * 加载打卡数据
   * 优先从 API 获取真实数据，API 不可用时使用模拟数据
   */
  loadCalendarData() {
    var that = this
    this.setData({ _loading: true })

    learnApi.getProgress().then(function (res) {
      var progress = res.data || {}

      // 保存 API 返回的统计值
      that._apiTotalLearned = progress.total_learned || 0
      that._apiTodayLearned = progress.today_learned || 0

      that.generateMockData()
    }).catch(function () {
      // API 不可用时，使用纯模拟数据
      that._apiTotalLearned = 0
      that._apiTodayLearned = 0
      that.generateMockData()
    })
  },

  /**
   * 生成当月模拟打卡数据
   * 基于日期奇偶性（偶数日打卡，奇数日不打卡），确保每次生成相同结果
   */
  generateMockData() {
    var year = this.data.year
    var month = this.data.month
    var daysInMonth = new Date(year, month, 0).getDate()
    var checkedDays = {}
    var count = 0

    for (var d = 1; d <= daysInMonth; d++) {
      // 偶数日打卡，奇数日不打卡（基于日期奇偶性，结果稳定）
      checkedDays[d] = d % 2 === 0
      if (checkedDays[d]) count++
    }

    // 根据 API 返回的 today_learned 修正今天打卡状态
    var today = new Date()
    if (year === today.getFullYear() && month === today.getMonth() + 1) {
      var dayOfMonth = today.getDate()
      if (this._apiTodayLearned > 0) {
        // today_learned > 0 则确保今天标记为已打卡
        if (!checkedDays[dayOfMonth]) {
          checkedDays[dayOfMonth] = true
          count++
        }
      } else {
        // today_learned === 0 则今天不打卡
        if (checkedDays[dayOfMonth]) {
          checkedDays[dayOfMonth] = false
          count--
        }
      }
    }

    this._checkedDays = checkedDays

    this.setData({
      // API 成功时使用 total_learned（总学习记录数），失败时使用当月模拟打卡天数
      totalDays: this._apiTotalLearned || count,
      currentStreak: 0
    })

    this.buildCalendarDays()
  },

  /**
   * 构建日历网格数据（6行 x 7列 = 42格）
   */
  buildCalendarDays() {
    var year = this.data.year
    var month = this.data.month
    var today = new Date()
    var daysInMonth = new Date(year, month, 0).getDate()
    var firstDayOfWeek = new Date(year, month - 1, 1).getDay()
    var checkedDays = this._checkedDays || {}

    var days = []

    // 上月补齐空白格
    for (var i = 0; i < firstDayOfWeek; i++) {
      days.push({ day: 0, checked: false, isToday: false, isEmpty: true })
    }

    // 当月日期格
    for (var d = 1; d <= daysInMonth; d++) {
      var isToday = year === today.getFullYear() && month === today.getMonth() + 1 && d === today.getDate()
      days.push({
        day: d,
        checked: !!checkedDays[d],
        isToday: isToday,
        isEmpty: false
      })
    }

    // 补齐剩余空白格至 42 格（6行）
    while (days.length < 42) {
      days.push({ day: 0, checked: false, isToday: false, isEmpty: true })
    }

    this.setData({
      days: days,
      _loading: false
    })
  },

  onPrevMonth() {
    var year = this.data.year
    var month = this.data.month
    if (month === 1) {
      year--
      month = 12
    } else {
      month--
    }
    this.setData({ year: year, month: month })
    this.loadCalendarData()
  },

  onNextMonth() {
    var year = this.data.year
    var month = this.data.month
    if (month === 12) {
      year++
      month = 1
    } else {
      month++
    }
    this.setData({ year: year, month: month })
    this.loadCalendarData()
  }
})

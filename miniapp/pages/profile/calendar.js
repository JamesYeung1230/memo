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
      var totalDays = progress.total_days || progress.days || 0
      var currentStreak = progress.current_streak || progress.streak_days || 0

      that.setData({
        totalDays: totalDays,
        currentStreak: currentStreak
      })

      // 有 real checked_days 字段则使用，否则生成模拟
      var checkedDays = progress.checked_days || null
      if (checkedDays) {
        that._checkedDays = checkedDays
        that.buildCalendarDays()
      } else {
        that.generateMockData()
      }
    }).catch(function () {
      that.generateMockData()
    })
  },

  /**
   * 生成当月模拟打卡数据
   */
  generateMockData() {
    var year = this.data.year
    var month = this.data.month
    var daysInMonth = new Date(year, month, 0).getDate()
    var checkedDays = {}
    var count = 0

    for (var d = 1; d <= daysInMonth; d++) {
      // 模拟约 65% 的日期已打卡
      checkedDays[d] = Math.random() < 0.65
      if (checkedDays[d]) count++
    }

    // 确保今天在当月且已打卡
    var today = new Date()
    if (year === today.getFullYear() && month === today.getMonth() + 1) {
      checkedDays[today.getDate()] = true
    }

    this._checkedDays = checkedDays

    this.setData({
      totalDays: count,
      currentStreak: 7
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

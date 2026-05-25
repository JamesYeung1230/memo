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

  loadCalendarData() {
    var that = this
    this.setData({ _loading: true })

    learnApi.getCheckinHistory(this.data.year, this.data.month).then(function (res) {
      var data = res.data || {}
      var checkedDates = data.checked_dates || []

      that.setData({
        currentStreak: data.current_streak || 0,
        totalDays: data.total_days || 0,
      })

      that.buildCalendarDays(checkedDates)
    }).catch(function () {
      // API 不可用时显示全未打卡
      that.setData({
        currentStreak: 0,
        totalDays: 0,
      })
      that.buildCalendarDays([])
    })
  },

  buildCalendarDays(checkedDates) {
    var year = this.data.year
    var month = this.data.month
    var today = new Date()
    var daysInMonth = new Date(year, month, 0).getDate()
    var firstDayOfWeek = new Date(year, month - 1, 1).getDay()

    // 转成 Set 便于查 "YYYY-MM-DD" 是否在 checkedDates 中
    var checkedSet = {}
    for (var i = 0; i < checkedDates.length; i++) {
      checkedSet[checkedDates[i]] = true
    }

    var days = []

    // 上月补齐空白格
    for (var i = 0; i < firstDayOfWeek; i++) {
      days.push({ day: 0, checked: false, isToday: false, isEmpty: true })
    }

    // 当月日期格
    var checkedCount = 0
    for (var d = 1; d <= daysInMonth; d++) {
      var dateStr = year + '-' + String(month).padStart(2, '0') + '-' + String(d).padStart(2, '0')
      var isToday = year === today.getFullYear() && month === today.getMonth() + 1 && d === today.getDate()
      var checked = !!checkedSet[dateStr]
      if (checked) checkedCount++
      days.push({
        day: d,
        checked: checked,
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
      totalDays: checkedCount,
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

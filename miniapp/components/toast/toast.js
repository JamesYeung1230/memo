var TYPE_MAP = {
  success: {
    icon: '✓',
    hex: '#22C55E',
    bg: 'rgba(34,197,94,0.1)'
  },
  warning: {
    icon: '⚠',
    hex: '#F59E0B',
    bg: 'rgba(245,158,11,0.1)'
  },
  error: {
    icon: '✗',
    hex: '#EF4444',
    bg: 'rgba(239,68,68,0.1)'
  },
  info: {
    icon: 'ℹ',
    hex: '#4A90D9',
    bg: 'rgba(74,144,217,0.1)'
  }
}

var DEFAULT_DURATION = {
  success: 2000,
  info: 2000,
  warning: 3000,
  error: 3000
}

Component({
  properties: {
    visible: {
      type: Boolean,
      value: false,
      observer: '_onVisibleChange'
    },
    type: {
      type: String,
      value: 'info'
    },
    message: {
      type: String,
      value: ''
    },
    duration: {
      type: Number,
      value: 0
    }
  },

  data: {
    showToast: false,
    iconText: '',
    bgColor: '',
    fgColor: ''
  },

  _dismissTimer: null,

  lifetimes: {
    detached() {
      if (this._dismissTimer) {
        clearTimeout(this._dismissTimer)
        this._dismissTimer = null
      }
    }
  },

  methods: {
    _onVisibleChange(newVal) {
      if (newVal) {
        this._show()
      } else {
        this._clear()
      }
    },

    _show() {
      if (this._dismissTimer) {
        clearTimeout(this._dismissTimer)
        this._dismissTimer = null
      }

      var type = this.properties.type || 'info'
      var config = TYPE_MAP[type] || TYPE_MAP.info

      var duration = this.properties.duration
      if (!duration || duration <= 0) {
        duration = DEFAULT_DURATION[type] || 2000
      }

      this.setData({
        showToast: true,
        iconText: config.icon,
        bgColor: config.bg,
        fgColor: config.hex
      })

      var that = this
      this._dismissTimer = setTimeout(function () {
        that._clear()
      }, duration)
    },

    _clear() {
      if (this._dismissTimer) {
        clearTimeout(this._dismissTimer)
        this._dismissTimer = null
      }
      this.setData({
        showToast: false
      })
    }
  }
})

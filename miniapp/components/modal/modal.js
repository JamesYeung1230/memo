Component({
  properties: {
    visible: {
      type: Boolean,
      value: false,
      observer: '_onVisibleChange'
    },
    title: {
      type: String,
      value: ''
    },
    content: {
      type: String,
      value: ''
    },
    showCancel: {
      type: Boolean,
      value: true
    },
    cancelText: {
      type: String,
      value: '取消'
    },
    confirmText: {
      type: String,
      value: '确定'
    },
    maskClosable: {
      type: Boolean,
      value: true
    }
  },

  data: {
    showOverlay: false,
    entering: false,
    leaving: false
  },

  _locked: false,
  _leaveTimer: null,

  lifetimes: {
    detached() {
      if (this._leaveTimer) {
        clearTimeout(this._leaveTimer)
        this._leaveTimer = null
      }
    }
  },

  methods: {
    _onVisibleChange(newVal) {
      if (newVal) {
        this._show()
      } else {
        this._hide()
      }
    },

    _show() {
      if (this._leaveTimer) {
        clearTimeout(this._leaveTimer)
        this._leaveTimer = null
      }
      this.setData({
        showOverlay: true,
        entering: true,
        leaving: false
      })
      var that = this
      setTimeout(function () {
        that.setData({ entering: false })
      }, 260)
    },

    _hide() {
      var that = this
      this.setData({
        entering: false,
        leaving: true
      })
      this._leaveTimer = setTimeout(function () {
        that.setData({
          showOverlay: false,
          leaving: false
        })
        that.triggerEvent('cancel')
      }, 210)
    },

    onMaskTap() {
      if (!this.properties.maskClosable) return
      this._hide()
    },

    onCancel() {
      if (this._locked) return
      this._lock()
      this._hide()
    },

    onConfirm() {
      if (this._locked) return
      this._lock()
      var that = this
      this.triggerEvent('confirm')
      setTimeout(function () {
        that._hide()
      }, 100)
    },

    _lock() {
      var that = this
      this._locked = true
      setTimeout(function () {
        that._locked = false
      }, 500)
    },

    noop() {}
  }
})

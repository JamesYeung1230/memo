Component({
  properties: {
    actions: {
      type: Array,
      value: []
    },
    disabled: {
      type: Boolean,
      value: false
    }
  },

  data: {
    translateX: 0,
    opened: false,
    startX: 0,
    startY: 0,
    swiping: false,
    actionButtonsWidth: 0
  },

  lifetimes: {
    attached() {
      this._calcActionWidth()
    },

    ready() {
      this._calcActionWidth()
    }
  },

  observers: {
    'actions'() {
      this._calcActionWidth()
      this.setData({
        translateX: 0,
        opened: false
      })
    }
  },

  methods: {
    _calcActionWidth() {
      const actions = this.data.actions
      if (!actions || !actions.length) {
        this.setData({ actionButtonsWidth: 0 })
        return
      }
      const buttonWidth = 140
      const width = actions.length * buttonWidth
      this.setData({ actionButtonsWidth: width })
    },

    onTouchStart(e) {
      if (this.properties.disabled) return
      if (!this.data.actions || !this.data.actions.length) return

      const touch = e.touches[0]
      this.setData({
        startX: touch.clientX,
        startY: touch.clientY,
        swiping: true
      })
    },

    onTouchMove(e) {
      if (!this.data.swiping || this.properties.disabled) return
      const touch = e.touches[0]
      const dx = touch.clientX - this.data.startX
      const dy = Math.abs(touch.clientY - this.data.startY)

      if (Math.abs(dx) < Math.abs(dy)) return

      const maxSwipe = this.data.actionButtonsWidth + 40
      let translateX = this.data.opened ? -maxSwipe + dx : dx

      if (translateX > 0) {
        translateX = 0
      }
      if (translateX < -maxSwipe) {
        translateX = -maxSwipe
      }

      this.setData({ translateX })
    },

    onTouchEnd() {
      if (!this.data.swiping || this.properties.disabled) return
      this.setData({ swiping: false })

      const threshold = this.data.actionButtonsWidth * 0.4
      const absX = Math.abs(this.data.translateX)

      if (absX > threshold) {
        this._open()
      } else {
        this._close()
      }
    },

    _open() {
      this.setData({
        translateX: -this.data.actionButtonsWidth,
        opened: true
      })
    },

    _close() {
      this.setData({
        translateX: 0,
        opened: false
      })
    },

    onActionTap(e) {
      const index = e.currentTarget.dataset.index
      this._close()
      setTimeout(() => {
        this.triggerEvent('action', { index })
      }, 300)
    },

    closeSwipe() {
      this._close()
    }
  }
})

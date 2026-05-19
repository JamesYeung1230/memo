Component({
  properties: {
    count: {
      type: Number,
      value: 0,
      observer: '_updateBadge'
    },
    color: {
      type: String,
      value: ''
    },
    maxCount: {
      type: Number,
      value: 99
    }
  },

  data: {
    mode: 'dot',
    displayCount: '',
    hidden: true
  },

  lifetimes: {
    attached() {
      this._updateBadge()
    }
  },

  methods: {
    _updateBadge() {
      const count = this.properties.count
      const maxCount = this.properties.maxCount

      if (count <= 0) {
        this.setData({
          hidden: true,
          mode: 'dot',
          displayCount: ''
        })
        return
      }

      if (count === 1) {
        this.setData({
          hidden: false,
          mode: 'dot',
          displayCount: ''
        })
        return
      }

      const displayCount = count > maxCount ? maxCount + '+' : String(count)

      this.setData({
        hidden: false,
        mode: 'number',
        displayCount
      })
    }
  }
})

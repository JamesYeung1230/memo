Component({
  properties: {
    percent: {
      type: Number,
      value: 0,
    },
    height: {
      type: Number,
      value: 12,
    },
    color: {
      type: String,
      value: '',
    },
    showText: {
      type: Boolean,
      value: false,
    },
  },

  data: {
    displayPercent: 0,
  },

  observers: {
    'percent'(newVal) {
      const target = Math.max(0, Math.min(100, newVal))
      this.setData({ displayPercent: 0 })
      setTimeout(() => {
        this.setData({ displayPercent: target })
      }, 16)
    },
  },
})

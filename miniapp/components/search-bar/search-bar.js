Component({
  properties: {
    value: {
      type: String,
      value: ''
    },
    placeholder: {
      type: String,
      value: '搜索...'
    },
    showCancel: {
      type: Boolean,
      value: false
    }
  },

  data: {
    inputValue: '',
    inputFocus: false
  },

  lifetimes: {
    attached() {
      this.setData({
        inputValue: this.properties.value
      })
    }
  },

  observers: {
    'value'(newVal) {
      if (newVal !== this.data.inputValue) {
        this.setData({ inputValue: newVal })
      }
    }
  },

  methods: {
    onInput(e) {
      const value = e.detail.value
      this.setData({ inputValue: value })
      this.triggerEvent('input', { value })
    },

    onConfirm(e) {
      const value = e.detail.value
      this.triggerEvent('search', { value })
    },

    onFocus() {
      this.setData({ inputFocus: true })
    },

    onBlur() {
      this.setData({ inputFocus: false })
    },

    onClear() {
      this.setData({ inputValue: '' })
      this.triggerEvent('input', { value: '' })
      this.triggerEvent('clear')
    },

    onCancel() {
      this.setData({
        inputValue: '',
        inputFocus: false
      })
      this.triggerEvent('cancel')
    }
  }
})

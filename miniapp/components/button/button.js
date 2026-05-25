Component({
  properties: {
    type: {
      type: String,
      value: 'primary'
    },
    size: {
      type: String,
      value: 'md'
    },
    loading: {
      type: Boolean,
      value: false
    },
    disabled: {
      type: Boolean,
      value: false
    },
    text: {
      type: String,
      value: ''
    }
  },

  data: {
    pressing: false
  },

  methods: {
    onClick() {
      if (this.properties.disabled || this.properties.loading) return
      this.setData({ pressing: true })
      setTimeout(() => {
        this.setData({ pressing: false })
      }, 150)
      this.triggerEvent('click')
    }
  }
})

Component({
  properties: {
    icon: {
      type: String,
      value: '📭',
    },
    message: {
      type: String,
      value: '暂无内容',
    },
    actionText: {
      type: String,
      value: '',
    },
    showAction: {
      type: Boolean,
      value: false,
    },
  },

  methods: {
    onAction() {
      this.triggerEvent('action', {})
    },
  },
})

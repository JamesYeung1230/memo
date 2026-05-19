Component({
  properties: {
    status: {
      type: String,
      value: 'draft'
    }
  },

  data: {
    label: '',
    dotColor: ''
  },

  lifetimes: {
    attached() {
      this._updateStatus()
    }
  },

  observers: {
    'status'() {
      this._updateStatus()
    }
  },

  methods: {
    _updateStatus() {
      const statusMap = {
        draft: { label: '未提交', dotColor: 'var(--color-text-hint)' },
        pending: { label: '审核中', dotColor: 'var(--color-warning)' },
        approved: { label: '已通过', dotColor: 'var(--color-success)' },
        rejected: { label: '已驳回', dotColor: 'var(--color-error)' }
      }

      const config = statusMap[this.properties.status] || statusMap.draft
      this.setData({
        label: config.label,
        dotColor: config.dotColor
      })
    }
  }
})

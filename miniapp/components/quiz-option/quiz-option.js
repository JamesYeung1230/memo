Component({
  properties: {
    letter: {
      type: String,
      value: ''
    },
    text: {
      type: String,
      value: ''
    },
    selected: {
      type: Boolean,
      value: false
    },
    status: {
      type: String,
      value: 'default'
    },
    showExplanation: {
      type: Boolean,
      value: false
    },
    explanation: {
      type: String,
      value: ''
    }
  },

  methods: {
    onSelect() {
      if (this.data.status === 'correct' || this.data.status === 'wrong') {
        return
      }
      this.triggerEvent('select', {
        letter: this.data.letter,
        text: this.data.text
      })
    }
  }
})

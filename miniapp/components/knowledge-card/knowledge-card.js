Component({
  properties: {
    card: {
      type: Object,
      value: {
        title: '',
        concept: '',
        description: '',
        analogy: '',
        tags: [],
        mastered: false,
        favorited: false
      }
    },
    expandable: {
      type: Boolean,
      value: true
    }
  },

  data: {
    expanded: false
  },

  methods: {
    onExpand() {
      const expanded = !this.data.expanded
      this.setData({ expanded })
      this.triggerEvent('expand', { expanded })
    },

    onMastered() {
      this.triggerEvent('mastered', { card: this.data.card })
    },

    onFavorite() {
      this.triggerEvent('favorite', { card: this.data.card })
    },

    onTagClick(e) {
      const { index } = e.currentTarget.dataset
      this.triggerEvent('tagClick', { index, tag: this.data.card.tags[index] })
    }
  }
})

/**
 * 导航栏组件 — 根据 UI 稿还原
 *
 * 两种模式：
 *   mode="center" — Tab 主页面（居中标题）
 *   mode="back"   — 子页面（← 返回 + 标题）
 *
 * 使用方式：
 *   <nav-bar mode="center" title="码上启航" />
 *   <nav-bar mode="back" title="设置" bind:back="onBack" />
 */

Component({
  options: {
    multipleSlots: true
  },

  properties: {
    mode: {
      type: String,
      value: 'center'  // 'center' | 'back'
    },
    title: {
      type: String,
      value: ''
    },
    color: {
      type: String,
      value: ''
    },
    background: {
      type: String,
      value: ''
    },
    show: {
      type: Boolean,
      value: true
    },
    delta: {
      type: Number,
      value: 1
    }
  },

  data: {
    statusBarHeight: 0,
    computedStyle: ''
  },

  lifetimes: {
    attached() {
      var info = wx.getSystemInfoSync()
      var statusBarHeight = info.statusBarHeight || 44
      this.setData({ statusBarHeight: statusBarHeight })
    }
  },

  methods: {
    onBack() {
      wx.navigateBack({ delta: this.data.delta })
      this.triggerEvent('back', { delta: this.data.delta })
    }
  }
})

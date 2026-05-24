Component({
  properties: {
    percent: {
      type: Number,
      value: 0,
    },
    subtitle: {
      type: String,
      value: '',
    },
    size: {
      type: Number,
      value: 160,
    },
    progressColor: {
      type: String,
      value: '',
    },
  },

  data: {
    displayPercent: 0,
    animated: false,
  },

  observers: {
    'percent'(newVal) {
      const target = Math.max(0, Math.min(100, newVal))
      this.setData({ displayPercent: target, animated: false }, () => {
        this.setData({ animated: true })
      })
    },
    'displayPercent, animated'() {
      this.renderFrame()
    },
    'progressColor'() {
      this.renderFrame()
    },
  },

  lifetimes: {
    attached() {
      this.drawProgress()
    },
  },

  methods: {
    drawProgress() {
      const query = this.createSelectorQuery()
      query.select('#progressCanvas').fields({ node: true, size: true }).exec((res) => {
        if (!res || !res[0] || !res[0].node) return
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = wx.getWindowInfo().pixelRatio
        const size = this.data.size
        canvas.width = size * dpr
        canvas.height = size * dpr
        ctx.scale(dpr, dpr)
        this._ctx = ctx
        this._canvasSize = size
        this.renderFrame()
      })
    },

    renderFrame() {
      const ctx = this._ctx
      const size = this._canvasSize
      if (!ctx || !size) return
      const percent = this.data.animated ? this.data.displayPercent : 0
      const lineWidth = 12
      const radius = (size - lineWidth) / 2
      const cx = size / 2
      const cy = size / 2
      const trackColor = 'var(--color-divider)'
      const fillColor = this.data.progressColor || (percent >= 100 ? 'var(--color-success)' : 'var(--color-primary)')

      ctx.clearRect(0, 0, size, size)

      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, 2 * Math.PI)
      ctx.strokeStyle = this.getComputedColor(trackColor)
      ctx.lineWidth = lineWidth
      ctx.lineCap = 'round'
      ctx.stroke()

      if (percent > 0) {
        const startAngle = -Math.PI / 2
        const endAngle = startAngle + (percent / 100) * 2 * Math.PI
        ctx.beginPath()
        ctx.arc(cx, cy, radius, startAngle, endAngle)
        ctx.strokeStyle = this.getComputedColor(fillColor)
        ctx.lineWidth = lineWidth
        ctx.lineCap = 'round'
        ctx.stroke()
      }
    },

    getComputedColor(cssVar) {
      const colorMap = {
        '--color-divider': '#E2E8F0',
        '--color-primary': '#4A90D9',
        '--color-success': '#22C55E',
      }
      if (cssVar.startsWith('var(--')) {
        const varName = cssVar.slice(4, -1)
        return colorMap[varName] || '#4A90D9'
      }
      return cssVar
    },
  },
})

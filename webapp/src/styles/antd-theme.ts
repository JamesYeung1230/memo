import type { ThemeConfig } from 'antd'

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: '#160C57',
    borderRadius: 8,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  components: {
    Menu: {
      darkItemBg: '#160C57',
      darkItemSelectedBg: '#2D1A8E',
    },
    Table: {
      headerBg: '#F4F2FA',
    },
  },
}

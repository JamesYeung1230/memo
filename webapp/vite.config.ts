import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3000,
    proxy: {
      // Auth service routes (admin login, token refresh, password change)
      '/api/v1/admin': {
        target: 'http://192.168.234.128:8001',
        changeOrigin: true,
      },
      '/api/v1/wechat': {
        target: 'http://192.168.234.128:8001',
        changeOrigin: true,
      },
      // All other business APIs → Core service
      '/api/v1': {
        target: 'http://192.168.234.128:8000',
        changeOrigin: true,
      },
    },
  },
})

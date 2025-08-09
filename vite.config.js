import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      // Proxy API requests to the backend during development
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      // Proxy AI requests to the AI backend during development
      '/ai': {
        target: 'http://localhost:5126',
        changeOrigin: true
      },
      // Proxy player stats requests to the backend during development
      '/stats': {
        target: 'http://localhost:9222',
        changeOrigin: true
      },
      // Proxy SignalR hub requests during development
      '/hub': {
        target: 'http://localhost:9223',
        changeOrigin: true,
        ws: true // Enable WebSocket proxying
      }
    }
  }
})

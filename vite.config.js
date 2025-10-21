import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    visualizer({
      filename: './dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split Vue core into its own chunk
          'vue-vendor': ['vue', 'vue-router', '@unhead/vue'],

          // Split Chart.js and related libs - only loads when charts are used
          'chart-vendor': ['chart.js', 'vue-chartjs', 'chartjs-plugin-annotation'],

          // Split PrimeVue into its own chunk
          'primevue-vendor': ['primevue'],

          // Split other heavy dependencies
          'misc-vendor': ['axios', '@microsoft/signalr', 'marked', 'jwt-decode'],
        }
      }
    },
    // Increase chunk size warning limit since we're intentionally creating larger vendor chunks
    chunkSizeWarningLimit: 600,
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

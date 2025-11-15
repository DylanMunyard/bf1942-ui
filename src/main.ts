import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createHead } from '@unhead/vue'

// PrimeVue imports
import PrimeVue from 'primevue/config'
import 'primevue/resources/themes/aura-dark-blue/theme.css'
import 'primevue/resources/primevue.min.css'
// PrimeIcons loaded via CDN in index.html for better performance
import 'primeflex/primeflex.css'

// Logger service
import { logger } from './services/loggerService'

const app = createApp(App)
const head = createHead()

// Vue error handler - catches component errors
app.config.errorHandler = (err, instance, info) => {
  logger.error(
    'Vue component error',
    err as Error,
    {
      component: instance?.$options.name || 'Unknown',
      info,
    }
  )
}

// Global error handler - catches uncaught errors
window.onerror = (message, source, lineno, colno, error) => {
  logger.error(
    'Uncaught error',
    error || new Error(String(message)),
    {
      source,
      lineno,
      colno,
    }
  )
  return false // Allow default error handling
}

// Unhandled promise rejection handler
window.onunhandledrejection = (event) => {
  logger.error(
    'Unhandled promise rejection',
    event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
    {
      promise: 'Unhandled rejection',
    }
  )
}

// Listen for auth changes to track user in logs
window.addEventListener('discord-auth-success', () => {
  const userData = localStorage.getItem('user')
  if (userData) {
    try {
      const user = JSON.parse(userData)
      logger.setUserId(user.id)
      logger.info('User authenticated', { username: user.username })
    } catch (err) {
      // Ignore parse errors
    }
  }
})

window.addEventListener('auth-logout', () => {
  logger.info('User logged out')
  logger.setUserId(undefined)
})

app.use(router)
app.use(head)
app.use(PrimeVue)

app.mount('#app')
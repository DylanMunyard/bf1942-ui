import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Application Insights (connection string from runtime config or build-time env)
import { appInsightsService } from './services/appInsightsService'
import { loadRuntimeConfig } from './config/runtimeConfig'

async function bootstrap() {
  const config = await loadRuntimeConfig()
  const fromRuntime = config?.applicationInsightsConnectionString
  const fromEnv = import.meta.env.VITE_APPLICATIONINSIGHTS_CONNECTION_STRING
  const connectionString = fromRuntime || fromEnv

  if (connectionString) {
    appInsightsService.initialize(connectionString)
    if (import.meta.env.DEV) {
      appInsightsService.flushAfterDelay(2000)
    }
  }

  const app = createApp(App)
  app.use(router)
  app.mount('#app')
}

bootstrap()

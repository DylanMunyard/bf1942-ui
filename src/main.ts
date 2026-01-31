import './assets/main.css'
import './assets/hacker-theme.css'

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

// Initialize Application Insights
import { appInsightsService } from './services/appInsightsService'

const connectionString = import.meta.env.VITE_APPLICATIONINSIGHTS_CONNECTION_STRING
if (connectionString) {
  appInsightsService.initialize(connectionString)
} else {
  console.warn('Application Insights connection string not configured. Telemetry will not be tracked.')
}

const app = createApp(App)
const head = createHead()

app.use(router)
app.use(head)
app.use(PrimeVue)

app.mount('#app')
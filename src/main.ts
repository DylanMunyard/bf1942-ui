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

const app = createApp(App)
const head = createHead()

app.use(router)
app.use(head)
app.use(PrimeVue)

app.mount('#app')
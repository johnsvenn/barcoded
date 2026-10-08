import { createApp } from 'vue'
import App from './App.vue'
import { setupUI } from './setupUI'
import './assets/main.css'

// Unregister any active service worker during dev mode so stale production/preview SWs
// don't intercept dev server asset requests.
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
            registration.unregister()
        }
    })
}

const app = createApp(App)
setupUI(app)
app.mount('#app')

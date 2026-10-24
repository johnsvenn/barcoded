import './assets/main.css';
import App from './App.vue';
import { createApp } from 'vue';
import { setupUI } from './setupUI';

// Unregister any active service worker during dev mode so stale production/preview SWs
// don't intercept dev server asset requests.
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
            registration.unregister();
        }
    });
}

const app = createApp(App);
setupUI(app);
app.mount('#app');

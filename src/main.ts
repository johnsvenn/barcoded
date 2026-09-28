import { createApp } from 'vue';
import App from './App.vue';
import { setupUI } from './setupUI';

const app = createApp(App);
setupUI(app);
app.mount('#app');

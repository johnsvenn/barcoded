import type { App } from 'vue';
import AppLayout from './components/AppLayout.vue';

export function setupUI(app: App) {
    app.component('AppLayout', AppLayout);
}

export { AppLayout };

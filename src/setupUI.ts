import type { App } from 'vue';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import { definePreset } from '@primevue/themes';
import ConfirmationService from 'primevue/confirmationservice';
import 'primeicons/primeicons.css';
import AppLayout from './components/AppLayout.vue';

/**
 * WorkUtils theme — built on PrimeVue Aura with customised typography
 * and a consistent 4px border-radius across all components.
 */
const WorkUtilsTheme = definePreset(Aura, {
  semantic: {
    borderRadius: {
      none: '0',
      xs: '4px',
      sm: '4px',
      md: '4px',
      lg: '4px',
      xl: '4px',
    },
    fontFamily: "'Roboto', sans-serif",
  },
  components: {
    card: {
      borderRadius: '4px',
    },
    button: {
      borderRadius: '4px',
    },
    inputtext: {
      borderRadius: '4px',
    },
    select: {
      borderRadius: '4px',
    },
    textarea: {
      borderRadius: '4px',
    },
  },
});

export function setupUI(app: App) {
  app.use(PrimeVue, {
    theme: {
      preset: WorkUtilsTheme,
      options: {
        darkModeSelector: '.dark-mode',
      },
    },
  });
  app.use(ConfirmationService);

  app.component('AppLayout', AppLayout);
}

export { AppLayout };

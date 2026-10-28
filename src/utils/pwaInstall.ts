import { computed, ref } from 'vue';

// Chromium-only event, not in the standard DOM typings
interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null);

const isStandalone = () =>
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

// True only when the browser has said the site can be installed and it isn't already running as an app
export const canInstallPwa = computed(() => deferredPrompt.value !== null);

export const initPwaInstall = () => {
    window.addEventListener('beforeinstallprompt', (event) => {
        if (isStandalone()) return;
        event.preventDefault();
        deferredPrompt.value = event as BeforeInstallPromptEvent;
    });

    window.addEventListener('appinstalled', () => {
        deferredPrompt.value = null;
    });
};

// Opens the browser's native install dialog, the same one as the address bar icon
export const promptPwaInstall = async () => {
    const event = deferredPrompt.value;
    if (!event) return;

    deferredPrompt.value = null;
    await event.prompt();
    await event.userChoice;
};

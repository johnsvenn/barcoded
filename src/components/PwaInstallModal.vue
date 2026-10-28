<script setup lang="ts">
import { ComputerDesktopIcon, XMarkIcon } from '@heroicons/vue/24/outline';

defineProps<{
    visible: boolean
}>();

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
    (e: 'install'): void
}>();

const close = () => {
    emit('update:visible', false);
};

const handleInstall = () => {
    emit('install');
};
</script>

<template>
    <Teleport to="body">
        <div v-if="visible"
             class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
             @click.self="close"
             @keydown.esc="close">
            <div class="bg-white rounded shadow-xl border border-slate-300 w-full max-w-md overflow-hidden flex flex-col">
                <!-- Header -->
                <div class="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50">
                    <h2 class="text-base font-semibold text-slate-800">Install Barcoded as an application</h2>
                    <button type="button"
                            class="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors"
                            aria-label="Close"
                            @click="close">
                        <XMarkIcon class="w-5 h-5" />
                    </button>
                </div>

                <!-- Body -->
                <div class="p-5">
                    <p class="text-sm text-slate-700">
                        Install Barcoded as a PWA application. This means it looks and behaves like a native app and you can use it offline.
                    </p>
                </div>

                <!-- Footer -->
                <div class="flex justify-between gap-2 px-5 py-3 bg-slate-50 border-t border-slate-200">
                    <button type="button"
                            class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors"
                            @click="close">
                        Cancel
                    </button>
                    <button type="button"
                            class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded transition-colors"
                            @click="handleInstall">
                        <ComputerDesktopIcon class="w-4 h-4" />
                        Install
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

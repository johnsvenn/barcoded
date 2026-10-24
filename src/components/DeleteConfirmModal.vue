<script setup lang="ts">
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline';

withDefaults(
    defineProps<{
        visible: boolean
        title?: string
        description?: string
        confirmLabel?: string
        cancelLabel?: string
    }>(),
    {
        title: 'Delete item?',
        description: 'This action cannot be undone.',
        confirmLabel: 'Delete',
        cancelLabel: 'Cancel',
    },
);

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
    (e: 'confirm'): void
    (e: 'cancel'): void
}>();

const close = () => {
    emit('update:visible', false);
    emit('cancel');
};

const handleConfirm = () => {
    emit('confirm');
    emit('update:visible', false);
};
</script>

<template>
    <Teleport to="body">
        <div v-if="visible"
             class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
             @click.self="close"
             @keydown.esc="close">
            <div class="bg-white dark:bg-slate-800 rounded shadow-xl border border-slate-200 dark:border-slate-700 p-6 max-w-sm w-full flex flex-col gap-4">
                <div class="flex items-center gap-3">
                    <div class="p-2 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400">
                        <ExclamationTriangleIcon class="w-6 h-6" />
                    </div>
                    <div>
                        <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100">
                            {{ title }}
                        </h3>
                        <p class="text-xs text-slate-500 dark:text-slate-400">
                            {{ description }}
                        </p>
                    </div>
                </div>
                <div class="flex justify-between gap-2 mt-2">
                    <button type="button"
                            class="cancel-btn px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors"
                            @click="close">
                        {{ cancelLabel }}
                    </button>
                    <button type="button"
                            class="confirm-btn px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
                            @click="handleConfirm">
                        {{ confirmLabel }}
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

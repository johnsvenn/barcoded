<script setup lang="ts">
defineProps<{
    title: string
}>();
</script>

<template>
    <div class="app__shell">
        <!-- Header -->
        <header class="header__bar">
            <div class="max-w-screen-xl mx-auto px-6 flex justify-between items-end">
                <div>
                    <h1 class="header__title py-2">{{ title }}</h1>
                    <div v-if="$slots.tabs"
                         class="max-w-screen-xl pt-2">
                        <slot name="tabs"></slot>
                    </div>
                </div>
                <div v-if="$slots.actions"
                     class="flex items-end gap-2 py-2">
                    <slot name="actions"></slot>
                </div>
            </div>
        </header>

        <!-- Page content with clear gap from header -->
        <main class="flex-1 max-w-screen-xl mx-auto w-full px-6 py-6">
            <slot></slot>
        </main>
    </div>
</template>

<style scoped>
/* Installed PWA: the app's own window already identifies it, so hide the title */
@media (display-mode: standalone) {
    .header__title {
        display: none;
    }
}
</style>

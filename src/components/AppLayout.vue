<script setup lang="ts">
defineProps<{
    title: string
}>()
</script>

<template>
    <div class="flex flex-col min-h-screen bg-olive-400 text-slate-900 font-sans">
        <!-- Header -->
        <header class="bg-white">
            <div class="max-w-screen-xl mx-auto px-6 py-3">
                <h1 class="text-sm font-bold text-slate-800 tracking-tight">{{ title }}</h1>
            </div>
            <div class="max-w-screen-xl mx-auto px-6 mx-auto flex justify-between">
                <div v-if="$slots.tabs" class="max-w-screen-xl pt-2">
                    <slot name="tabs"></slot>
                </div>
                <div v-if="$slots.actions" class="flex items-center gap-2">
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

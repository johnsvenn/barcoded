<script setup lang="ts">
import type { Category } from '../db'

defineProps<{
    categories: Category[]
    modelValue: string
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
}>()
</script>

<template>
    <nav class="flex gap-1 overflow-x-auto scrollbar-none" aria-label="Category tabs">
        <button
            type="button"
            class="px-4 py-2 text-sm font-medium border rounded-t transition-colors whitespace-nowrap"
            :class="
                modelValue === 'all'
                    ? 'bg-olive-400 border-olive-400 text-white font-semibold'
                    : 'bg-slate-100 border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-200'
            "
            @click="emit('update:modelValue', 'all')"
        >
            All
        </button>
        <button
            v-for="c in categories"
            :key="c.id"
            type="button"
            class="px-4 py-2 text-sm font-medium border rounded-t transition-colors whitespace-nowrap"
            :class="
                modelValue === c.id
                    ? 'bg-olive-400 border-olive-400 text-white font-semibold'
                    : 'bg-slate-100 border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-200'
            "
            @click="emit('update:modelValue', c.id)"
        >
            {{ c.name }}
        </button>
    </nav>
</template>

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
    <nav class="tab__nav" aria-label="Category tabs">
        <button
            type="button"
            class="tab__button"
            :class="{ 'tab__button--active': modelValue === 'all' }"
            @click="emit('update:modelValue', 'all')"
        >
            All
        </button>
        <button
            v-for="c in categories"
            :key="c.id"
            type="button"
            class="tab__button"
            :class="{ 'tab__button--active': modelValue === c.id }"
            @click="emit('update:modelValue', c.id)"
        >
            {{ c.name }}
        </button>
    </nav>
</template>

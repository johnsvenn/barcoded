<script setup lang="ts">
import type { Tag } from '../db'

defineProps<{
    tags: Tag[]
    modelValue: string
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
}>()
</script>

<template>
    <nav class="tab__nav" aria-label="Tag tabs">
        <button
            type="button"
            class="tab__button"
            :class="{ 'tab__button--active': modelValue === 'all' }"
            @click="emit('update:modelValue', 'all')"
        >
            All
        </button>
        <button
            v-for="c in tags"
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

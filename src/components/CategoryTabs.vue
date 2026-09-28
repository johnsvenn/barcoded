<script setup lang="ts">
import type { Category } from '../db';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';

defineProps<{
  categories: Category[];
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();
</script>

<template>
  <Tabs :value="modelValue" @update:value="emit('update:modelValue', $event as string)">
    <TabList>
      <Tab value="all">All</Tab>
      <Tab v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</Tab>
    </TabList>
  </Tabs>
</template>

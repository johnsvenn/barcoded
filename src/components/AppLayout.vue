<script setup lang="ts">
defineProps<{
  title: string;
}>();
</script>

<template>
  <div class="app-layout">
    <header class="app-header">
      <div class="header-top-row">
        <h1>{{ title }}</h1>
        <div v-if="$slots.actions" class="header-actions">
          <slot name="actions"></slot>
        </div>
      </div>
      <div v-if="$slots.tabs" class="header-tabs">
        <slot name="tabs"></slot>
      </div>
    </header>
    <main class="app-content">
      <slot></slot>
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--surface-ground);
  color: var(--text-color);
  font-family: var(--font-family);
}

.app-header {
  background-color: var(--surface-card);
  padding: 0.75rem 2rem 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.header-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 0.5rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-tabs {
  margin-top: 0.25rem;
}

.app-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--primary-color);
}

.app-content {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}
</style>

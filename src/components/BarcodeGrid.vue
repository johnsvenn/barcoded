<script setup lang="ts">
import type { Barcode } from '../db';
import BarcodeCard from './BarcodeCard.vue';

defineProps<{
  barcodes: Barcode[];
  getTypeDef: (type: string) => { label: string; bcid: string } | undefined;
}>();

const emit = defineEmits<{
  (e: 'edit', barcode: Barcode): void;
  (e: 'delete', event: Event, id: string): void;
}>();
</script>

<template>
  <div class="grid-container">
    <BarcodeCard
      v-for="b in barcodes"
      :key="b.id"
      :barcode="b"
      :type-label="getTypeDef(b.type)?.label ?? b.type"
      :type-bcid="getTypeDef(b.type)?.bcid ?? b.type"
      @edit="emit('edit', $event)"
      @delete="(evt, id) => emit('delete', evt, id)"
    />

    <div v-if="barcodes.length === 0" class="empty-state">
      <i class="pi pi-qrcode empty-icon"></i>
      <p>No barcodes in this category. Click "+ New Barcode" to create one.</p>
    </div>
  </div>
</template>

<style scoped>
.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 4rem 1rem;
  color: var(--text-color-secondary);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  display: block;
}
</style>

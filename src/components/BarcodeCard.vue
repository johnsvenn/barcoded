<script setup lang="ts">
import { onMounted, watch, nextTick, ref } from 'vue';
import type { Barcode } from '../db';
import bwipjs from 'bwip-js';
import Card from 'primevue/card';
import Button from 'primevue/button';

const props = defineProps<{
  barcode: Barcode;
  typeLabel: string;
  typeBcid: string;
}>();

const emit = defineEmits<{
  (e: 'edit', barcode: Barcode): void;
  (e: 'delete', event: Event, id: string): void;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);

const renderBarcode = () => {
  if (!canvasRef.value) return;

  const options: bwipjs.RenderOptions = {
    bcid: props.typeBcid,
    text: props.barcode.value,
    scale: 3,
    includetext: true,
    textxalign: 'center',
    ...(props.barcode.type !== 'qrcode' ? { height: 10 } : {}),
  };

  try {
    bwipjs.toCanvas(canvasRef.value, options);
  } catch (err) {
    console.error(`bwip-js error for barcode ${props.barcode.id}:`, err);
  }
};

onMounted(() => {
  nextTick(renderBarcode);
});

watch(
  () => [props.barcode.value, props.barcode.type, props.typeBcid],
  () => {
    nextTick(renderBarcode);
  }
);
</script>

<template>
  <Card class="barcode-card">
    <template #content>
      <div class="card-inner">
        <!-- Delete button pinned top-right -->
        <Button icon="pi pi-trash" severity="danger" text rounded
                aria-label="Delete barcode" class="delete-btn"
                @click="emit('delete', $event, barcode.id)" />

        <div class="barcode-meta">
          <div class="barcode-value">{{ barcode.value }}</div>
          <div class="barcode-sub">
            {{ typeLabel }}
          </div>
        </div>

        <div class="canvas-wrapper">
          <canvas ref="canvasRef"></canvas>
        </div>

        <!-- Edit button pinned bottom-right -->
        <Button icon="pi pi-pencil" severity="secondary" text rounded
                aria-label="Edit barcode" class="edit-btn"
                @click="emit('edit', barcode)" />
      </div>
    </template>
  </Card>
</template>

<style scoped>
.barcode-card { overflow: visible; }

.card-inner {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-bottom: 0.5rem;
}

.delete-btn {
  position: absolute;
  top: -0.75rem;
  right: -0.75rem;
  z-index: 10;
}

.edit-btn {
  position: absolute;
  bottom: -0.5rem;
  right: -0.5rem;
  z-index: 10;
}

.barcode-meta { text-align: center; }

.barcode-value {
  font-weight: 600;
  font-size: 1rem;
  word-break: break-all;
}

.barcode-sub {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
  margin-top: 0.2rem;
}

.canvas-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  background: #fff;
  border-radius: 4px;
}

canvas { max-width: 100%; height: auto !important; }
</style>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Barcode, Category } from '../db';
import { getValidationError } from '../utils/validation';
import Dialog from 'primevue/dialog';
import Select from 'primevue/select';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';

const props = defineProps<{
  visible: boolean;
  editingBarcode: Barcode | null;
  types: Array<{ label: string; value: string; bcid: string }>;
  categories: Category[];
  initialCategoryId: string;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'save', data: { type: string; value: string; categoryId: string }): void;
}>();

const barcodeType = ref('qrcode');
const barcodeCategory = ref('');
const barcodeValue = ref('');

watch(
  () => props.visible,
  (isVis) => {
    if (isVis) {
      if (props.editingBarcode) {
        barcodeType.value = props.editingBarcode.type;
        barcodeCategory.value = props.editingBarcode.categoryId;
        barcodeValue.value = props.editingBarcode.value;
      } else {
        barcodeType.value = 'qrcode';
        barcodeCategory.value = props.initialCategoryId || (props.categories[0]?.id ?? '');
        barcodeValue.value = '';
      }
    }
  },
  { immediate: true }
);

const validationError = computed(() =>
  getValidationError(barcodeType.value, barcodeValue.value)
);

const isValid = computed(() => !!barcodeValue.value && !validationError.value);

const handleSave = () => {
  if (!isValid.value) return;
  emit('save', {
    type: barcodeType.value,
    value: barcodeValue.value,
    categoryId: barcodeCategory.value,
  });
};
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    :header="editingBarcode ? 'Edit Barcode' : 'Create Barcode'"
    modal
    :style="{ width: '450px' }"
  >
    <div class="form-grid">
      <div class="field">
        <label for="modal-type">Type</label>
        <Select
          id="modal-type"
          v-model="barcodeType"
          :options="types"
          optionLabel="label"
          optionValue="value"
          class="w-full"
        />
      </div>

      <div class="field">
        <label for="modal-category">Category</label>
        <Select
          id="modal-category"
          v-model="barcodeCategory"
          :options="categories"
          optionLabel="name"
          optionValue="id"
          class="w-full"
        />
      </div>

      <div class="field">
        <label for="modal-value">Value *</label>
        <InputText
          id="modal-value"
          v-model="barcodeValue"
          class="w-full"
          :class="{ 'p-invalid': validationError }"
          @keyup.enter="handleSave"
        />
        <small v-if="validationError" class="p-error">{{ validationError }}</small>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <Button label="Cancel" severity="secondary" text @click="emit('update:visible', false)" />
        <Button
          :label="editingBarcode ? 'Save' : 'Create'"
          icon="pi pi-check"
          @click="handleSave"
          :disabled="!isValid"
        />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.form-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.w-full { width: 100%; }

.dialog-footer {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.p-error {
  color: var(--red-500);
  font-size: 0.8rem;
}
</style>

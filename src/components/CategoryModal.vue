<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Category } from '../db';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';

const props = defineProps<{
  visible: boolean;
  categories: Category[];
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'add', name: string): void;
  (e: 'update', id: string, name: string): void;
  (e: 'delete', category: Category): void;
}>();

const editingCat = ref<Category | null>(null);
const newCatName = ref('');
const catNameError = ref('');

const resetForm = () => {
  editingCat.value = null;
  newCatName.value = '';
  catNameError.value = '';
};

watch(
  () => props.visible,
  (isVis) => {
    if (isVis) resetForm();
  }
);

const startEditCat = (cat: Category) => {
  editingCat.value = cat;
  newCatName.value = cat.name;
  catNameError.value = '';
};

const saveCat = () => {
  const name = newCatName.value.trim();
  if (!name) {
    catNameError.value = 'Name is required';
    return;
  }

  if (editingCat.value) {
    emit('update', editingCat.value.id, name);
  } else {
    emit('add', name);
  }

  resetForm();
};
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    header="Manage Categories"
    modal
    :style="{ width: '460px' }"
  >
    <!-- Add / edit inline form -->
    <div class="cat-add-form">
      <InputText
        v-model="newCatName"
        class="w-full"
        :placeholder="editingCat ? 'Edit name…' : 'New category name…'"
        @keyup.enter="saveCat"
      />
      <small v-if="catNameError" class="p-error">{{ catNameError }}</small>
      <div class="cat-add-actions">
        <Button v-if="editingCat" label="Cancel" severity="secondary" text @click="resetForm" />
        <Button
          :label="editingCat ? 'Save' : 'Add Category'"
          icon="pi pi-plus"
          @click="saveCat"
          :disabled="!newCatName.trim()"
        />
      </div>
    </div>

    <hr class="divider" />

    <!-- Category list -->
    <ul class="cat-list">
      <li v-if="categories.length === 0" class="cat-list-empty">No categories yet.</li>
      <li
        v-for="cat in categories"
        :key="cat.id"
        class="cat-list-item"
        :class="{ 'is-editing': editingCat?.id === cat.id }"
      >
        <span class="cat-list-name">{{ cat.name }}</span>
        <div class="cat-list-actions">
          <Button
            icon="pi pi-pencil"
            text
            rounded
            aria-label="Edit"
            size="small"
            @click="startEditCat(cat)"
          />
          <Button
            icon="pi pi-trash"
            text
            rounded
            severity="danger"
            aria-label="Delete"
            size="small"
            @click="emit('delete', cat)"
          />
        </div>
      </li>
    </ul>
  </Dialog>
</template>

<style scoped>
.cat-add-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.w-full { width: 100%; }

.cat-add-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.divider {
  border: none;
  border-top: 1px solid var(--surface-border);
  margin: 1rem 0;
}

.cat-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-height: 260px;
  overflow-y: auto;
}

.cat-list-empty {
  text-align: center;
  color: var(--text-color-secondary);
  padding: 1rem 0;
  font-size: 0.9rem;
}

.cat-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.4rem 0.6rem;
  border-radius: 4px;
  transition: background 0.12s;
}

.cat-list-item:hover { background: var(--surface-hover); }
.cat-list-item.is-editing { background: var(--primary-50, #e8f5e9); }

.cat-list-name { font-size: 0.9rem; }

.cat-list-actions {
  display: flex;
  gap: 0.1rem;
}

.p-error {
  color: var(--red-500);
  font-size: 0.8rem;
}
</style>

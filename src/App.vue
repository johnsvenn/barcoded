<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { db, type Barcode, type Category } from './db';
import AppLayout from './components/AppLayout.vue';
import BarcodeGrid from './components/BarcodeGrid.vue';
import CategoryTabs from './components/CategoryTabs.vue';
import BarcodeModal from './components/BarcodeModal.vue';
import CategoryModal from './components/CategoryModal.vue';
import Button from 'primevue/button';
import ConfirmPopup from 'primevue/confirmpopup';
import { useConfirm } from 'primevue/useconfirm';
import { v4 as uuidv4 } from 'uuid';

const confirm = useConfirm();

// ─── Barcode type definitions ───────────────────────────────────────────────
const types = ref([
  { label: 'QR Code',   value: 'qrcode',  bcid: 'qrcode'  },
  { label: 'Code 39',   value: 'code39',  bcid: 'code39'  },
  { label: 'EAN-13',    value: 'ean13',   bcid: 'ean13'   },
  { label: 'Code 128',  value: 'code128', bcid: 'code128' },
]);

// ─── State ───────────────────────────────────────────────────────────────────
const barcodes         = ref<Barcode[]>([]);
const categories       = ref<Category[]>([]);
const filterCategory   = ref('all');

// Modals state
const showBarcodeModal = ref(false);
const editingBarcode   = ref<Barcode | null>(null);
const showCatModal     = ref(false);

// ─── Filtered barcodes ──────────────────────────────────────────────────────
const filteredBarcodes = computed(() =>
  filterCategory.value === 'all'
    ? barcodes.value
    : barcodes.value.filter(b => b.categoryId === filterCategory.value)
);

// ─── Helpers ───────────────────────────────────────────────────────────────
const getTypeDef = (value: string) => types.value.find(t => t.value === value);

// ─── Data loading ───────────────────────────────────────────────────────────
const loadData = async () => {
  barcodes.value   = await db.barcodes.orderBy('createdAt').reverse().toArray();
  categories.value = await db.categories.toArray();

  if (categories.value.length === 0) {
    const defaultCat: Category = { id: uuidv4(), name: 'Uncategorized' };
    await db.categories.add(defaultCat);
    categories.value.push(defaultCat);
  }
};

// ─── Barcode CRUD handlers ──────────────────────────────────────────────────
const openCreateModal = () => {
  editingBarcode.value = null;
  showBarcodeModal.value = true;
};

const openEditModal = (b: Barcode) => {
  editingBarcode.value = b;
  showBarcodeModal.value = true;
};

const handleSaveBarcode = async (data: { type: string; value: string; categoryId: string }) => {
  if (editingBarcode.value) {
    await db.barcodes.update(editingBarcode.value.id, {
      type: data.type,
      value: data.value,
      categoryId: data.categoryId,
    });
  } else {
    const b: Barcode = {
      id: uuidv4(),
      type: data.type,
      value: data.value,
      categoryId: data.categoryId,
      createdAt: Date.now(),
    };
    await db.barcodes.add(b);
  }

  showBarcodeModal.value = false;
  await loadData();
};

const confirmDeleteBarcode = (event: Event, id: string) => {
  confirm.require({
    target: event.currentTarget as HTMLElement,
    message: 'Delete barcode?',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: 'Delete',
      severity: 'danger',
    },
    accept: async () => {
      await db.barcodes.delete(id);
      await loadData();
    },
  });
};

// ─── Category CRUD handlers ─────────────────────────────────────────────────
const handleAddCat = async (name: string) => {
  const cat: Category = { id: uuidv4(), name };
  await db.categories.add(cat);
  await loadData();
};

const handleUpdateCat = async (id: string, name: string) => {
  await db.categories.update(id, { name });
  await loadData();
};

const handleDeleteCat = async (cat: Category) => {
  await db.categories.delete(cat.id);
  await loadData();
  const fallback = categories.value[0]?.id ?? '';
  await db.barcodes.where('categoryId').equals(cat.id).modify({ categoryId: fallback });
  await loadData();

  if (filterCategory.value === cat.id) filterCategory.value = 'all';
};

onMounted(loadData);
</script>

<template>
  <AppLayout title="Barcode Generator">
    <template #actions>
      <Button
        icon="pi pi-pencil"
        text
        rounded
        aria-label="Manage categories"
        @click="showCatModal = true"
        title="Manage Categories"
      />
      <Button icon="pi pi-plus" label="New Barcode" @click="openCreateModal" />
    </template>

    <template #tabs>
      <CategoryTabs v-model="filterCategory" :categories="categories" />
    </template>

    <ConfirmPopup />

    <div class="main-container">
      <BarcodeGrid
        :barcodes="filteredBarcodes"
        :get-type-def="getTypeDef"
        @edit="openEditModal"
        @delete="confirmDeleteBarcode"
      />
    </div>

    <!-- Create / Edit Barcode Modal -->
    <BarcodeModal
      v-model:visible="showBarcodeModal"
      :editing-barcode="editingBarcode"
      :types="types"
      :categories="categories"
      :initial-category-id="filterCategory !== 'all' ? filterCategory : categories[0]?.id ?? ''"
      @save="handleSaveBarcode"
    />

    <!-- Category Management Modal -->
    <CategoryModal
      v-model:visible="showCatModal"
      :categories="categories"
      @add="handleAddCat"
      @update="handleUpdateCat"
      @delete="handleDeleteCat"
    />
  </AppLayout>
</template>

<style scoped>
.main-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
</style>

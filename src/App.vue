<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { db, type Barcode, type Category } from './db'
import { BARCODE_TYPES } from './constants/barcodeTypes'
import AppLayout from './components/AppLayout.vue'
import BarcodeGrid from './components/BarcodeGrid.vue'
import CategoryTabs from './components/CategoryTabs.vue'
import BarcodeModal from './components/BarcodeModal.vue'
import CategoryModal from './components/CategoryModal.vue'
import BarcodeScanModal from './components/BarcodeScanModal.vue'
import SettingsModal from './components/SettingsModal.vue'
import { ListBulletIcon, PlusIcon, AdjustmentsHorizontalIcon } from '@heroicons/vue/24/outline'
import { v4 as uuidv4 } from 'uuid'

// ─── Barcode type definitions ───────────────────────────────────────────────
const types = ref(BARCODE_TYPES)

// ─── State ───────────────────────────────────────────────────────────────────
const barcodes = ref<Barcode[]>([])
const categories = ref<Category[]>([])
const filterCategory = ref('all')

// Modals state
const showBarcodeModal = ref(false)
const editingBarcode = ref<Barcode | null>(null)
const showCatModal = ref(false)
const showSettingsModal = ref(false)

// Scan modal state
const showScanModal = ref(false)
const scanIndex = ref(0)

// ─── Filtered barcodes ──────────────────────────────────────────────────────
const filteredBarcodes = computed(() =>
    filterCategory.value === 'all'
        ? barcodes.value
        : barcodes.value.filter((b) => b.categoryId === filterCategory.value),
)

const openScanModal = (b: Barcode) => {
    const idx = filteredBarcodes.value.findIndex((x) => x.id === b.id)
    scanIndex.value = idx >= 0 ? idx : 0
    showScanModal.value = true
}

// ─── Helpers ───────────────────────────────────────────────────────────────
const getTypeDef = (value: string) => types.value.find((t) => t.value === value)

// ─── Data loading ───────────────────────────────────────────────────────────
const loadData = async () => {
    barcodes.value = await db.barcodes.orderBy('createdAt').reverse().toArray()
    categories.value = await db.categories.toArray()

    if (categories.value.length === 0) {
        const defaultCat: Category = { id: uuidv4(), name: 'Uncategorized' }
        await db.categories.add(defaultCat)
        categories.value.push(defaultCat)
    }
}

// ─── Barcode CRUD handlers ──────────────────────────────────────────────────
const openCreateModal = () => {
    editingBarcode.value = null
    showBarcodeModal.value = true
}

const openEditModal = (b: Barcode) => {
    editingBarcode.value = b
    showBarcodeModal.value = true
}

const handleSaveBarcode = async (data: { type: string; value: string; categoryId: string }) => {
    if (editingBarcode.value) {
        await db.barcodes.update(editingBarcode.value.id, {
            type: data.type,
            value: data.value,
            categoryId: data.categoryId,
        })
    } else {
        const b: Barcode = {
            id: uuidv4(),
            type: data.type,
            value: data.value,
            categoryId: data.categoryId,
            createdAt: Date.now(),
        }
        await db.barcodes.add(b)
    }

    showBarcodeModal.value = false
    await loadData()
}

const handleDeleteBarcode = async (_event: Event, id: string) => {
    await db.barcodes.delete(id)
    await loadData()
}

// ─── Category CRUD handlers ─────────────────────────────────────────────────
const handleAddCat = async (name: string) => {
    const cat: Category = { id: uuidv4(), name }
    await db.categories.add(cat)
    await loadData()
}

const handleUpdateCat = async (id: string, name: string) => {
    await db.categories.update(id, { name })
    await loadData()
}

const handleDeleteCat = async (cat: Category) => {
    await db.categories.delete(cat.id)
    await loadData()
    const fallback = categories.value[0]?.id ?? ''
    await db.barcodes.where('categoryId').equals(cat.id).modify({ categoryId: fallback })
    await loadData()

    if (filterCategory.value === cat.id) filterCategory.value = 'all'
}

onMounted(loadData)
</script>

<template>
    <AppLayout title="Barcoded">
        <template #actions>
            <button
                type="button"
                class="btn-primary__button"
                @click="openCreateModal"
            >
                <PlusIcon class="w-6 h-6" />
                New Barcode
            </button>
            <button
                type="button"
                class="btn-secondary__button"
                aria-label="Manage categories"
                title="Manage Categories"
                @click="showCatModal = true"
            >
                <ListBulletIcon class="w-6 h-6" />
                Categories
            </button>
            <button
                type="button"
                class="btn-secondary__button"
                aria-label="Settings"
                title="Settings"
                @click="showSettingsModal = true">
                <AdjustmentsHorizontalIcon class="w-6 h-6" />
            </button>
        </template>

        <template #tabs>
            <CategoryTabs v-model="filterCategory" :categories="categories" />
        </template>

        <div class="flex flex-col gap-6 justify-center">
            <BarcodeGrid
                :barcodes="filteredBarcodes"
                :get-type-def="getTypeDef"
                @edit="openEditModal"
                @delete="handleDeleteBarcode"
                @scan="openScanModal"
            />
        </div>

        <!-- Create / Edit Barcode Modal -->
        <BarcodeModal
            v-model:visible="showBarcodeModal"
            :editing-barcode="editingBarcode"
            :types="types"
            :categories="categories"
            :initial-category-id="
                filterCategory !== 'all' ? filterCategory : (categories[0]?.id ?? '')
            "
            @save="handleSaveBarcode"
        />

        <!-- Scan / View Barcode Modal -->
        <BarcodeScanModal
            v-model:visible="showScanModal"
            v-model:current-index="scanIndex"
            :barcodes="filteredBarcodes"
            :get-type-def="getTypeDef"
        />

        <!-- Category Management Modal -->
        <CategoryModal
            v-model:visible="showCatModal"
            :categories="categories"
            @add="handleAddCat"
            @update="handleUpdateCat"
            @delete="handleDeleteCat"
        />

        <SettingsModal
            v-model:visible="showSettingsModal"
            @imported="loadData"
        />
    </AppLayout>
</template>

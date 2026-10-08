<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { db, type Barcode, type Category } from './db'
import AppLayout from './components/AppLayout.vue'
import BarcodeGrid from './components/BarcodeGrid.vue'
import CategoryTabs from './components/CategoryTabs.vue'
import BarcodeModal from './components/BarcodeModal.vue'
import CategoryModal from './components/CategoryModal.vue'
import { PencilSquareIcon, PlusIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import { v4 as uuidv4 } from 'uuid'

// ─── Barcode type definitions ───────────────────────────────────────────────
const types = ref([
    { label: 'QR Code', value: 'qrcode', bcid: 'qrcode' },
    { label: 'Code 39', value: 'code39', bcid: 'code39' },
    { label: 'EAN-13', value: 'ean13', bcid: 'ean13' },
    { label: 'Code 128', value: 'code128', bcid: 'code128' },
])

// ─── State ───────────────────────────────────────────────────────────────────
const barcodes = ref<Barcode[]>([])
const categories = ref<Category[]>([])
const filterCategory = ref('all')

// Modals state
const showBarcodeModal = ref(false)
const editingBarcode = ref<Barcode | null>(null)
const showCatModal = ref(false)
const deletingBarcodeId = ref<string | null>(null)

// ─── Filtered barcodes ──────────────────────────────────────────────────────
const filteredBarcodes = computed(() =>
    filterCategory.value === 'all'
        ? barcodes.value
        : barcodes.value.filter((b) => b.categoryId === filterCategory.value),
)

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

const confirmDeleteBarcode = (_event: Event, id: string) => {
    deletingBarcodeId.value = id
}

const handleDeleteConfirm = async () => {
    if (!deletingBarcodeId.value) return
    await db.barcodes.delete(deletingBarcodeId.value)
    deletingBarcodeId.value = null
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
    <AppLayout title="Barcode Generator">
        <template #actions>
            <button
                type="button"
                class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 hover:text-slate-800 transition-colors"
                aria-label="Manage categories"
                title="Manage Categories"
                @click="showCatModal = true"
            >
                <PencilSquareIcon class="w-4 h-4" />
                Categories
            </button>
            <button
                type="button"
                class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                @click="openCreateModal"
            >
                <PlusIcon class="w-4 h-4" />
                New Barcode
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
                @delete="confirmDeleteBarcode"
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

        <!-- Category Management Modal -->
        <CategoryModal
            v-model:visible="showCatModal"
            :categories="categories"
            @add="handleAddCat"
            @update="handleUpdateCat"
            @delete="handleDeleteCat"
        />

        <!-- Confirmation Modal for Delete -->
        <Teleport to="body">
            <div
                v-if="deletingBarcodeId !== null"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
                @click.self="deletingBarcodeId = null"
                @keydown.esc="deletingBarcodeId = null"
            >
                <div
                    class="bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-6 max-w-sm w-full flex flex-col gap-4"
                >
                    <div class="flex items-center gap-3">
                        <div
                            class="p-2 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400"
                        >
                            <ExclamationTriangleIcon class="w-6 h-6" />
                        </div>
                        <div>
                            <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100">
                                Delete barcode?
                            </h3>
                            <p class="text-xs text-slate-500 dark:text-slate-400">
                                This action cannot be undone.
                            </p>
                        </div>
                    </div>
                    <div class="flex justify-end gap-2 mt-2">
                        <button
                            type="button"
                            class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors"
                            @click="deletingBarcodeId = null"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
                            @click="handleDeleteConfirm"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>
    </AppLayout>
</template>

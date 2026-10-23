<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { db, type Barcode, type Tag } from './db'
import { BARCODE_TYPES } from './constants/barcodeTypes'
import AppLayout from './components/AppLayout.vue'
import BarcodeGrid from './components/BarcodeGrid.vue'
import TagTabs from './components/TagTabs.vue'
import BarcodeModal from './components/BarcodeModal.vue'
import TagModal from './components/TagModal.vue'
import BarcodeScanModal from './components/BarcodeScanModal.vue'
import SettingsModal from './components/SettingsModal.vue'
import { TagIcon, PlusIcon, AdjustmentsHorizontalIcon } from '@heroicons/vue/24/outline'
import { v4 as uuidv4 } from 'uuid'
import { deleteTag, resolveTagIds, tagKey } from './utils/tags'

// ─── Barcode type definitions ───────────────────────────────────────────────
const types = ref(BARCODE_TYPES)

// ─── State ───────────────────────────────────────────────────────────────────
const barcodes = ref<Barcode[]>([])
const tags = ref<Tag[]>([])
const filterTag = ref('all')

// Modals state
const showBarcodeModal = ref(false)
const editingBarcode = ref<Barcode | null>(null)
const showTagModal = ref(false)
const showSettingsModal = ref(false)

// Scan modal state
const showScanModal = ref(false)
const scanIndex = ref(0)

// ─── Filtered barcodes ──────────────────────────────────────────────────────
const filteredBarcodes = computed(() =>
    filterTag.value === 'all'
        ? barcodes.value
        : barcodes.value.filter((b) => b.tags.includes(filterTag.value)),
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
    tags.value = await db.tags.toArray()
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

const handleSaveBarcode = async (data: { type: string; value: string; tags: string[] }) => {
    const known = new Map(
        (await db.tags.toArray()).map((c) => [tagKey(c.name), c]),
    )
    const created: Tag[] = []
    const tagIds = resolveTagIds(data.tags, known, created)
    if (created.length > 0) await db.tags.bulkAdd(created)

    if (editingBarcode.value) {
        await db.barcodes.update(editingBarcode.value.id, {
            type: data.type,
            value: data.value,
            tags: tagIds,
        })
    } else {
        const b: Barcode = {
            id: uuidv4(),
            type: data.type,
            value: data.value,
            tags: tagIds,
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

// ─── Tag CRUD handlers ─────────────────────────────────────────────────
const handleAddTag = async (name: string) => {
    const tag: Tag = { id: uuidv4(), name }
    await db.tags.add(tag)
    await loadData()
}

const handleUpdateTag = async (id: string, name: string) => {
    await db.tags.update(id, { name })
    await loadData()
}

const handleDeleteTag = async (tag: Tag) => {
    await deleteTag(tag.id)
    await loadData()

    if (filterTag.value === tag.id) filterTag.value = 'all'
}

onMounted(loadData)
</script>

<template>
    <AppLayout title="Barcoded">
        <template #actions>
            <button
                ref="openCreateModalButton"
                type="button"
                class="btn-primary__button btn-round btn-round--lg"
                aria-label="New barcode"
                title="New Barcode"
                @click="openCreateModal"
            >
                <PlusIcon class="w-10 h-10" />
            </button>
            <button
                ref="showTagModalButton"
                type="button"
                class="btn-secondary__button btn-round btn-round--sm"
                aria-label="Manage tags"
                title="Manage Tags"
                @click="showTagModal = true"
            >
                <TagIcon class="w-6 h-6" />
            </button>
            <button
                ref="showSettingsModalButton"
                type="button"
                class="btn-secondary__button btn-round btn-round--sm"
                aria-label="Settings"
                title="Settings"
                @click="showSettingsModal = true">
                <AdjustmentsHorizontalIcon class="w-6 h-6" />
            </button>
        </template>

        <template #tabs>
            <TagTabs v-model="filterTag" :tags="tags" />
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
            :tags="tags"
            :initial-tag-id="filterTag !== 'all' ? filterTag : ''"
            @save="handleSaveBarcode"
        />

        <!-- Scan / View Barcode Modal -->
        <BarcodeScanModal
            v-model:visible="showScanModal"
            v-model:current-index="scanIndex"
            :barcodes="filteredBarcodes"
            :get-type-def="getTypeDef"
        />

        <!-- Tag Management Modal -->
        <TagModal
            v-model:visible="showTagModal"
            :tags="tags"
            @add="handleAddTag"
            @update="handleUpdateTag"
            @delete="handleDeleteTag"
        />

        <SettingsModal
            v-model:visible="showSettingsModal"
            @imported="loadData"
        />
    </AppLayout>
</template>

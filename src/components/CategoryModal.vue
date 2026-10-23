<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Category } from '../db'
import { PlusIcon, PencilSquareIcon, TrashIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import DeleteConfirmModal from './DeleteConfirmModal.vue'

const props = defineProps<{
    visible: boolean
    categories: Category[]
}>()

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
    (e: 'add', name: string): void
    (e: 'update', id: string, name: string): void
    (e: 'delete', category: Category): void
}>()

const editingCat = ref<Category | null>(null)
const newCatName = ref('')
const catNameError = ref('')
const categoryToDelete = ref<Category | null>(null)
const showDeleteModal = ref(false)

const resetForm = () => {
    editingCat.value = null
    newCatName.value = ''
    catNameError.value = ''
    categoryToDelete.value = null
    showDeleteModal.value = false
}

watch(
    () => props.visible,
    (isVis) => {
        if (isVis) resetForm()
    },
)

const startEditCat = (cat: Category) => {
    editingCat.value = cat
    newCatName.value = cat.name
    catNameError.value = ''
}

const promptDeleteCat = (cat: Category) => {
    categoryToDelete.value = cat
    showDeleteModal.value = true
}

const handleConfirmDelete = () => {
    if (categoryToDelete.value) {
        emit('delete', categoryToDelete.value)
        categoryToDelete.value = null
    }
}

const saveCat = () => {
    const name = newCatName.value.trim()
    if (!name) {
        catNameError.value = 'Name is required'
        return
    }

    if (editingCat.value) {
        emit('update', editingCat.value.id, name)
    } else {
        emit('add', name)
    }

    resetForm()
}

const close = () => {
    emit('update:visible', false)
}
</script>

<template>
    <Teleport to="body">
        <div
            v-if="visible"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
            @click.self="close"
            @keydown.esc="close"
        >
            <div
                class="bg-white rounded shadow-xl border border-slate-300 w-full max-w-md overflow-hidden flex flex-col"
            >
                <!-- Header -->
                <div
                    class="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50"
                >
                    <h2 class="text-base font-semibold text-slate-800">Manage Tags</h2>
                    <button
                        type="button"
                        class="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors"
                        aria-label="Close"
                        @click="close"
                    >
                        <XMarkIcon class="w-5 h-5" />
                    </button>
                </div>

                <!-- Body -->
                <div class="p-5 flex flex-col gap-4">
                    <!-- Add / edit inline form -->
                    <div class="flex flex-col gap-2">
                        <input
                            v-model="newCatName"
                            type="text"
                            class="w-full px-3 py-2.5 border border-slate-300 rounded bg-white text-slate-800 text-sm leading-snug focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            :placeholder="editingCat ? 'Edit name…' : 'New tag name…'"
                            @keyup.enter="saveCat"
                        />
                        <small v-if="catNameError" class="text-xs text-red-500">{{
                            catNameError
                        }}</small>
                        <div class="flex justify-end gap-2">
                            <button
                                v-if="editingCat"
                                type="button"
                                class="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors"
                                @click="resetForm"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-green-500 hover:bg-green-600 disabled:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed rounded transition-colors"
                                :disabled="!newCatName.trim()"
                                @click="saveCat"
                            >
                                <PlusIcon class="w-6 h-6" />
                                {{ editingCat ? 'Save' : 'Add Tag' }}
                            </button>
                        </div>
                    </div>

                    <hr class="border-slate-200 my-1" />

                    <!-- Category list -->
                    <ul
                        class="flex flex-col max-h-64 overflow-y-auto border border-slate-200 rounded divide-y divide-slate-100"
                    >
                        <li
                            v-if="categories.length === 0"
                            class="text-center py-4 text-sm text-slate-500"
                        >
                            No tags yet.
                        </li>
                        <li
                            v-for="cat in categories"
                            :key="cat.id"
                            class="flex items-center justify-between px-3 py-2 transition-colors"
                            :class="
                                editingCat?.id === cat.id
                                    ? 'bg-blue-50 text-blue-900'
                                    : 'hover:bg-slate-50'
                            "
                        >
                            <span class="text-sm text-slate-800 font-medium">{{ cat.name }}</span>
                            <div class="flex items-center gap-1">
                                <button
                                    type="button"
                                    aria-label="Edit"
                                    class="p-1.5 rounded text-slate-500 hover:text-slate-700 transition-colors"
                                    @click="startEditCat(cat)"
                                >
                                    <PencilSquareIcon class="w-6 h-6" />
                                </button>
                                <button
                                    type="button"
                                    aria-label="Delete"
                                    class="p-1.5 rounded text-red-500 hover:text-red-700 transition-colors"
                                    @click="promptDeleteCat(cat)"
                                >
                                    <TrashIcon class="w-6 h-6" />
                                </button>
                            </div>
                        </li>
                    </ul>
                </div>
                <div
                    class="flex justify-between gap-2 px-5 py-3 bg-slate-50 border-t border-slate-200"
                >
                    <button
                        type="button"
                        class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors"
                        @click="close"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>

        <DeleteConfirmModal
            v-model:visible="showDeleteModal"
            title="Delete tag?"
            description="The tag will be removed from every barcode that has it. This action cannot be undone."
            @confirm="handleConfirmDelete"
        />
    </Teleport>
</template>

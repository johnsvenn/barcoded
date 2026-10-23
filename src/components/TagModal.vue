<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Tag } from '../db'
import { PlusIcon, PencilSquareIcon, TrashIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import DeleteConfirmModal from './DeleteConfirmModal.vue'
import { normaliseTagName, tagKey } from '../utils/tags'

const props = defineProps<{
    visible: boolean
    tags: Tag[]
}>()

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
    (e: 'add', name: string): void
    (e: 'update', id: string, name: string): void
    (e: 'delete', tag: Tag): void
}>()

const editingTag = ref<Tag | null>(null)
const newTagName = ref('')
const tagNameError = ref('')
const tagToDelete = ref<Tag | null>(null)
const showDeleteModal = ref(false)

const resetForm = () => {
    editingTag.value = null
    newTagName.value = ''
    tagNameError.value = ''
    tagToDelete.value = null
    showDeleteModal.value = false
}

watch(
    () => props.visible,
    (isVis) => {
        if (isVis) resetForm()
    },
)

const startEditTag = (tag: Tag) => {
    editingTag.value = tag
    newTagName.value = tag.name
    tagNameError.value = ''
}

const promptDeleteTag = (tag: Tag) => {
    tagToDelete.value = tag
    showDeleteModal.value = true
}

const handleConfirmDelete = () => {
    if (tagToDelete.value) {
        emit('delete', tagToDelete.value)
        tagToDelete.value = null
    }
}

const saveTag = () => {
    const name = normaliseTagName(newTagName.value)
    if (!name) {
        tagNameError.value = 'Name is required'
        return
    }

    const isDuplicate = props.tags.some(
        (tag) => tag.id !== editingTag.value?.id && tagKey(tag.name) === name,
    )
    if (isDuplicate) {
        tagNameError.value = 'A tag with this name already exists'
        return
    }

    if (editingTag.value) {
        emit('update', editingTag.value.id, name)
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
        <div v-if="visible"
             class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
             @click.self="close"
             @keydown.esc="close">
            <div class="bg-white rounded shadow-xl border border-slate-300 w-full max-w-md overflow-hidden flex flex-col">
                <!-- Header -->
                <div class="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50">
                    <h2 class="text-base font-semibold text-slate-800">Manage Tags</h2>
                    <button type="button"
                            class="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors"
                            aria-label="Close"
                            @click="close">
                        <XMarkIcon class="w-5 h-5" />
                    </button>
                </div>

                <!-- Body -->
                <div class="p-5 flex flex-col gap-4">
                    <!-- Add / edit inline form -->
                    <div class="flex flex-col gap-2">
                        <input v-model="newTagName"
                               type="text"
                               class="w-full px-3 py-2.5 border border-slate-300 rounded bg-white text-slate-800 text-sm leading-snug focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                               :placeholder="editingTag ? 'Edit name…' : 'New tag name…'"
                               @keyup.enter="saveTag"/>
                        <small v-if="tagNameError"
                               class="text-xs text-red-500">{{
                                   tagNameError
                               }}</small>
                        <div class="flex justify-end gap-2">
                            <button v-if="editingTag"
                                    type="button"
                                    class="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors"
                                    @click="resetForm">
                                Cancel
                            </button>
                            <button type="button"
                                    class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-green-500 hover:bg-green-600 disabled:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed rounded transition-colors"
                                    :disabled="!newTagName.trim()"
                                    @click="saveTag">
                                <PlusIcon class="w-6 h-6" />
                                {{ editingTag ? 'Save' : 'Add Tag' }}
                            </button>
                        </div>
                    </div>

                    <hr class="border-slate-200 my-1" />

                    <!-- Tag list -->
                    <ul class="flex flex-col max-h-64 overflow-y-auto border border-slate-200 rounded divide-y divide-slate-100">
                        <li v-if="tags.length === 0"
                            class="text-center py-4 text-sm text-slate-500">
                            No tags yet.
                        </li>
                        <li v-for="tag in tags"
                            :key="tag.id"
                            class="flex items-center justify-between px-3 py-2 transition-colors"
                            :class="
                                editingTag?.id === tag.id
                                    ? 'bg-blue-50 text-blue-900'
                                    : 'hover:bg-slate-50'
                            ">
                            <span class="text-sm text-slate-800 font-medium">{{ tag.name }}</span>
                            <div class="flex items-center gap-1">
                                <button type="button"
                                        aria-label="Edit"
                                        class="p-1.5 rounded text-slate-500 hover:text-slate-700 transition-colors"
                                        @click="startEditTag(tag)">
                                    <PencilSquareIcon class="w-6 h-6" />
                                </button>
                                <button type="button"
                                        aria-label="Delete"
                                        class="p-1.5 rounded text-red-500 hover:text-red-700 transition-colors"
                                        @click="promptDeleteTag(tag)">
                                    <TrashIcon class="w-6 h-6" />
                                </button>
                            </div>
                        </li>
                    </ul>
                </div>
                <div class="flex justify-between gap-2 px-5 py-3 bg-slate-50 border-t border-slate-200">
                    <button type="button"
                            class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors"
                            @click="close">
                        Cancel
                    </button>
                </div>
            </div>
        </div>

        <DeleteConfirmModal v-model:visible="showDeleteModal"
                            title="Delete tag?"
                            description="The tag will be removed from every barcode that has it. This action cannot be undone."
                            @confirm="handleConfirmDelete"/>
    </Teleport>
</template>

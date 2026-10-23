<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Barcode, Category } from '../db'
import { getValidationError } from '../utils/validation'
import { tagKey } from '../utils/tags'
import { CheckCircleIcon, XMarkIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
    visible: boolean
    editingBarcode: Barcode | null
    types: Array<{ label: string; value: string; bcid: string }>
    categories: Category[]
    initialCategoryId: string
}>()

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
    (e: 'save', data: { type: string; value: string; tags: string[] }): void
}>()

const barcodeType = ref('qrcode')
const barcodeValue = ref('')
const selectedTags = ref<string[]>([])
const tagQuery = ref('')

const tagNamesFromIds = (ids: string[]) =>
    ids
        .map((id) => props.categories.find((c) => c.id === id)?.name)
        .filter((name): name is string => !!name)

watch(
    () => props.visible,
    (isVis) => {
        if (isVis) {
            tagQuery.value = ''
            if (props.editingBarcode) {
                barcodeType.value = props.editingBarcode.type
                selectedTags.value = tagNamesFromIds(props.editingBarcode.tags)
                barcodeValue.value = props.editingBarcode.value
            } else {
                barcodeType.value = 'qrcode'
                selectedTags.value = tagNamesFromIds(
                    props.initialCategoryId ? [props.initialCategoryId] : [],
                )
                barcodeValue.value = ''
            }
        }
    },
    { immediate: true },
)

const validationError = computed(() => getValidationError(barcodeType.value, barcodeValue.value))

const isValid = computed(() => !!barcodeValue.value && !validationError.value)

const newTagName = computed(() => tagQuery.value.trim())

const existingTagFor = (name: string) =>
    props.categories.find((c) => tagKey(c.name) === tagKey(name))

const isSelected = (name: string) => selectedTags.value.some((t) => tagKey(t) === tagKey(name))

const suggestions = computed(() =>
    props.categories.filter(
        (c) => !isSelected(c.name) && tagKey(c.name).includes(tagKey(tagQuery.value)),
    ),
)

const canCreate = computed(() => !!newTagName.value && !existingTagFor(newTagName.value))

const addTag = (name: string) => {
    if (!isSelected(name)) selectedTags.value.push(name)
    tagQuery.value = ''
}

const removeTag = (name: string) => {
    selectedTags.value = selectedTags.value.filter((t) => tagKey(t) !== tagKey(name))
}

const submitTagQuery = () => {
    if (!newTagName.value) return
    addTag(existingTagFor(newTagName.value)?.name ?? newTagName.value)
}

const handleSave = () => {
    if (!isValid.value) return
    emit('save', {
        type: barcodeType.value,
        value: barcodeValue.value,
        tags: [...selectedTags.value],
    })
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
                    <h2 class="text-base font-semibold text-slate-800">
                        {{ editingBarcode ? 'Edit Barcode' : 'Create Barcode' }}
                    </h2>
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
                    <div class="flex flex-col gap-1">
                        <label for="modal-type" class="text-sm font-medium text-slate-700"
                            >Type</label
                        >
                        <select
                            id="modal-type"
                            v-model="barcodeType"
                            class="w-full px-3 py-2.5 border border-slate-300 rounded bg-white text-slate-800 text-sm leading-snug focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option v-for="t in types" :key="t.value" :value="t.value">
                                {{ t.label }}
                            </option>
                        </select>
                    </div>

                    <div class="flex flex-col gap-1">
                        <label for="modal-tag-input" class="text-sm font-medium text-slate-700"
                            >Tags</label
                        >
                        <div
                            class="flex flex-wrap items-center gap-1.5 w-full px-2 py-1.5 border border-slate-300 rounded bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
                        >
                            <span
                                v-for="name in selectedTags"
                                :key="name"
                                class="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 text-xs font-medium text-blue-800 bg-blue-50 border border-blue-200 rounded"
                            >
                                {{ name }}
                                <button
                                    type="button"
                                    class="p-0.5 rounded text-blue-600 hover:text-blue-900"
                                    :aria-label="`Remove tag ${name}`"
                                    @click="removeTag(name)"
                                >
                                    <XMarkIcon class="w-3 h-3" />
                                </button>
                            </span>
                            <input
                                id="modal-tag-input"
                                v-model="tagQuery"
                                type="text"
                                class="flex-1 min-w-24 py-1 text-sm text-slate-800 bg-transparent focus:outline-none"
                                placeholder="Find or create a tag"
                                @keydown.enter.prevent="submitTagQuery"
                            />
                        </div>
                        <div v-if="suggestions.length > 0 || canCreate" class="flex flex-wrap gap-1.5 pt-1">
                            <button
                                v-for="tag in suggestions"
                                :key="tag.id"
                                type="button"
                                class="px-2 py-0.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors"
                                @click="addTag(tag.name)"
                            >
                                {{ tag.name }}
                            </button>
                            <button
                                v-if="canCreate"
                                type="button"
                                class="px-2 py-0.5 text-xs font-medium text-green-700 bg-green-50 border border-green-300 rounded hover:bg-green-100 transition-colors"
                                @click="addTag(newTagName)"
                            >
                                Create '{{ newTagName }}'
                            </button>
                        </div>
                    </div>

                    <div class="flex flex-col gap-1">
                        <label for="modal-value" class="text-sm font-medium text-slate-700"
                            >Value *</label
                        >
                        <input
                            id="modal-value"
                            v-model="barcodeValue"
                            type="text"
                            class="w-full px-3 py-2.5 border border-slate-300 rounded bg-white text-slate-800 text-sm leading-snug focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            :class="{ 'border-red-400 focus:ring-red-400': validationError }"
                            @keyup.enter="handleSave"
                        />
                        <small v-if="validationError" class="text-xs text-red-500">{{
                            validationError
                        }}</small>
                    </div>
                </div>

                <!-- Footer -->
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
                    <button
                        type="button"
                        class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 disabled:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed rounded transition-colors"
                        :disabled="!isValid"
                        @click="handleSave"
                    >
                        <CheckCircleIcon class="w-4 h-4" />
                        {{ editingBarcode ? 'Save changes' : 'Create' }}
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

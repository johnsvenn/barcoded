<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Barcode, Category } from '../db'
import { getValidationError } from '../utils/validation'
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
    (e: 'save', data: { type: string; value: string; categoryId: string }): void
}>()

const barcodeType = ref('qrcode')
const barcodeCategory = ref('')
const barcodeValue = ref('')

watch(
    () => props.visible,
    (isVis) => {
        if (isVis) {
            if (props.editingBarcode) {
                barcodeType.value = props.editingBarcode.type
                barcodeCategory.value = props.editingBarcode.categoryId
                barcodeValue.value = props.editingBarcode.value
            } else {
                barcodeType.value = 'qrcode'
                barcodeCategory.value = props.initialCategoryId || (props.categories[0]?.id ?? '')
                barcodeValue.value = ''
            }
        }
    },
    { immediate: true },
)

const validationError = computed(() => getValidationError(barcodeType.value, barcodeValue.value))

const isValid = computed(() => !!barcodeValue.value && !validationError.value)

const handleSave = () => {
    if (!isValid.value) return
    emit('save', {
        type: barcodeType.value,
        value: barcodeValue.value,
        categoryId: barcodeCategory.value,
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
                        <label for="modal-category" class="text-sm font-medium text-slate-700"
                            >Category</label
                        >
                        <select
                            id="modal-category"
                            v-model="barcodeCategory"
                            class="w-full px-3 py-2.5 border border-slate-300 rounded bg-white text-slate-800 text-sm leading-snug focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option v-for="c in categories" :key="c.id" :value="c.id">
                                {{ c.name }}
                            </option>
                        </select>
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

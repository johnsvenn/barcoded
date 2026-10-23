<script setup lang="ts">
import { ref, watch } from 'vue'
import {
    XMarkIcon,
    ArrowUpTrayIcon,
    DocumentTextIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
} from '@heroicons/vue/24/outline'
import { db } from '../db'
import { validateAndParseImport, executeImport } from '../utils/csvImport'

const props = defineProps<{
    visible: boolean
}>()

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
    (e: 'imported'): void
}>()

const selectedFile = ref<File | null>(null)
const isUploading = ref(false)
const errors = ref<string[]>([])
const successMessage = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)

watch(
    () => props.visible,
    (isVis) => {
        if (!isVis) {
            resetState()
        }
    },
)

const resetState = () => {
    selectedFile.value = null
    isUploading.value = false
    errors.value = []
    successMessage.value = ''
    if (fileInputRef.value) {
        fileInputRef.value.value = ''
    }
}

const close = () => {
    emit('update:visible', false)
}

const triggerFileInput = () => {
    fileInputRef.value?.click()
}

const onFileSelected = (event: Event) => {
    const input = event.target as HTMLInputElement
    errors.value = []
    successMessage.value = ''

    if (input.files && input.files.length > 0) {
        const file = input.files[0]
        if (file) {
            selectedFile.value = file
        }
    }
}

const handleImport = async () => {
    if (!selectedFile.value) return

    isUploading.value = true
    errors.value = []
    successMessage.value = ''

    try {
        const text = await selectedFile.value.text()
        const existingBarcodes = await db.barcodes.toArray()
        const existingTags = await db.tags.toArray()

        const validation = validateAndParseImport(text, existingBarcodes, existingTags)

        if (validation.errors.length > 0) {
            errors.value = validation.errors
            isUploading.value = false
            return
        }

        const result = await executeImport(validation.validRowsToImport, existingTags)

        successMessage.value = `Successfully imported ${result.importedCount} barcodes (${validation.skippedDuplicatesCount} duplicates skipped).`
        selectedFile.value = null
        if (fileInputRef.value) {
            fileInputRef.value.value = ''
        }

        emit('imported')
    } catch (err) {
        errors.value = [
            `Failed to read or import file: ${err instanceof Error ? err.message : String(err)}`,
        ]
    } finally {
        isUploading.value = false
    }
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
                class="bg-white rounded shadow-xl border border-slate-300 w-full max-w-lg overflow-hidden flex flex-col"
            >
                <!-- Header -->
                <div
                    class="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50"
                >
                    <h2 class="text-base font-semibold text-slate-800">Settings</h2>
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
                <div class="p-5 flex flex-col gap-5">
                    <div>
                        <h3 class="text-sm font-semibold text-slate-800 mb-1">Import Barcodes (CSV)</h3>
                        <p class="text-xs text-slate-500">
                            Upload a CSV file containing barcode data. Required fields:
                            <span class="font-semibold text-slate-700">Code Type</span> (e.g. qrcode, code39, ean13) and
                            <span class="font-semibold text-slate-700">Value</span>. Tag is optional; separate several with semicolons (e.g. Shopping;Work).
                        </p>
                    </div>

                    <!-- File selection area -->
                    <div class="flex flex-col gap-2">
                        <input
                            ref="fileInputRef"
                            type="file"
                            accept=".csv,text/csv,text/plain"
                            class="hidden"
                            @change="onFileSelected"
                        />
                        <div
                            class="border-2 border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100/80 transition-colors cursor-pointer"
                            @click="triggerFileInput"
                        >
                            <DocumentTextIcon class="w-8 h-8 text-slate-400 mb-1" />
                            <p v-if="!selectedFile" class="text-xs font-medium text-slate-600">
                                Click to choose a CSV file
                            </p>
                            <p v-else class="text-xs font-semibold text-blue-600 truncate max-w-full">
                                {{ selectedFile.name }} ({{ (selectedFile.size / 1024).toFixed(1) }} KB)
                            </p>
                        </div>
                    </div>

                    <!-- Errors alert -->
                    <div
                        v-if="errors.length > 0"
                        class="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3.5 flex flex-col gap-2 text-xs"
                    >
                        <div class="flex items-center gap-1.5 font-semibold text-red-700">
                            <ExclamationTriangleIcon class="w-4 h-4 shrink-0 text-red-600" />
                            <span>Cannot import file. Please fix the following errors:</span>
                        </div>
                        <ul class="max-h-36 overflow-y-auto space-y-1 list-disc pl-4 text-red-700">
                            <li v-for="(err, idx) in errors" :key="idx">
                                {{ err }}
                            </li>
                        </ul>
                    </div>

                    <!-- Success alert -->
                    <div
                        v-if="successMessage"
                        class="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3.5 flex items-center gap-2 text-xs font-medium"
                    >
                        <CheckCircleIcon class="w-5 h-5 shrink-0 text-green-600" />
                        <span>{{ successMessage }}</span>
                    </div>
                </div>

                <!-- Footer -->
                <div
                    class="flex justify-between items-center px-5 py-3.5 bg-slate-50 border-t border-slate-200"
                >
                    <button
                        type="button"
                        class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors"
                        @click="close"
                    >
                        Close
                    </button>

                    <button
                        type="button"
                        class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed rounded transition-colors"
                        :disabled="!selectedFile || isUploading"
                        @click="handleImport"
                    >
                        <ArrowUpTrayIcon class="w-4 h-4" />
                        {{ isUploading ? 'Importing...' : 'Upload & Import' }}
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

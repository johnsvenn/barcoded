<script setup lang="ts">
import { onMounted, watch, nextTick, ref } from 'vue'
import type { Barcode } from '../db'
import bwipjs from 'bwip-js'
import { TrashIcon, PencilSquareIcon } from '@heroicons/vue/24/outline'
import DeleteConfirmModal from './DeleteConfirmModal.vue'

const props = defineProps<{
    barcode: Barcode
    typeLabel: string
    typeBcid: string
}>()

const emit = defineEmits<{
    (e: 'edit', barcode: Barcode): void
    (e: 'delete', event: Event, id: string): void
    (e: 'scan', barcode: Barcode): void
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const showDeleteModal = ref(false)
const lastDeleteEvent = ref<Event | null>(null)

const openDeleteModal = (event: Event) => {
    lastDeleteEvent.value = event
    showDeleteModal.value = true
}

const handleConfirmDelete = () => {
    const event = lastDeleteEvent.value || new CustomEvent('delete')
    emit('delete', event, props.barcode.id)
}

const renderBarcode = () => {
    if (!canvasRef.value) return

    const options: bwipjs.RenderOptions = {
        bcid: props.typeBcid,
        text: props.barcode.value,
        scale: 3,
        includetext: true,
        textxalign: 'center',
        ...(props.barcode.type !== 'qrcode' ? { height: 10 } : {}),
    }

    try {
        bwipjs.toCanvas(canvasRef.value, options)
    } catch (err) {
        console.error(`bwip-js error for barcode ${props.barcode.id}:`, err)
    }
}

onMounted(() => {
    nextTick(renderBarcode)
})

watch(
    () => [props.barcode.value, props.barcode.type, props.typeBcid],
    () => {
        nextTick(renderBarcode)
    },
)
</script>

<template>
    <div class="bg-white border border-slate-200 rounded flex flex-col overflow-hidden">
        <!-- Card body: barcode meta + canvas (click to open scan view) -->
        <div
            class="p-4 flex flex-col gap-3 flex-1 cursor-pointer group"
            role="button"
            tabindex="0"
            aria-label="View barcode"
            @click="emit('scan', barcode)"
            @keydown.enter.space.prevent="emit('scan', barcode)"
        >
            <div class="text-center">
                <div class="font-semibold text-sm break-all text-slate-800 leading-snug">
                    {{ barcode.value }}
                </div>
                <div class="text-xs text-slate-500 mt-0.5">{{ typeLabel }}</div>
            </div>

            <div
                class="flex justify-center items-center p-3 X-bg-slate-50 X-border border-slate-200 rounded transition-opacity"
            >
                <canvas ref="canvasRef" class="max-w-full h-auto!"></canvas>
            </div>
        </div>

        <!-- Card footer: action buttons, contained within card -->
        <div class="px-3 py-2 flex items-center justify-between gap-2">
            <button
                type="button"
                aria-label="Edit barcode"
                class="edit-btn inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 bg-white hover:text-slate-800 transition-colors"
                @click="emit('edit', barcode)"
            >
                <PencilSquareIcon class="w-6 h-6" />
            </button>
            <button
                type="button"
                aria-label="Delete barcode"
                class="delete-btn inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 bg-white hover:text-red-700 transition-colors"
                @click="openDeleteModal($event)"
            >
                <TrashIcon class="w-6 h-6" />
            </button>
        </div>

        <DeleteConfirmModal
            v-model:visible="showDeleteModal"
            title="Delete barcode?"
            description="This action cannot be undone."
            @confirm="handleConfirmDelete"
        />
    </div>
</template>

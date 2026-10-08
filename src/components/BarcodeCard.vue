<script setup lang="ts">
import { onMounted, watch, nextTick, ref } from 'vue'
import type { Barcode } from '../db'
import bwipjs from 'bwip-js'
import { TrashIcon, PencilIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
    barcode: Barcode
    typeLabel: string
    typeBcid: string
}>()

const emit = defineEmits<{
    (e: 'edit', barcode: Barcode): void
    (e: 'delete', event: Event, id: string): void
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)

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
        <!-- Card body: barcode meta + canvas -->
        <div class="p-4 flex flex-col gap-3 flex-1">
            <div class="text-center">
                <div class="font-semibold text-sm break-all text-slate-800 leading-snug">
                    {{ barcode.value }}
                </div>
                <div class="text-xs text-slate-500 mt-0.5">{{ typeLabel }}</div>
            </div>

            <div
                class="flex justify-center items-center p-3 X-bg-slate-50 X-border border-slate-200 rounded"
            >
                <canvas ref="canvasRef" class="max-w-full h-auto!"></canvas>
            </div>
        </div>

        <!-- Card footer: action buttons, contained within card -->
        <div class="px-3 py-2 flex items-center justify-end gap-2">
            <button
                type="button"
                aria-label="Edit barcode"
                class="edit-btn inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-100 hover:text-slate-800 transition-colors"
                @click="emit('edit', barcode)"
            >
                <PencilIcon class="w-6 h-6" />
                Edit
            </button>
            <button
                type="button"
                aria-label="Delete barcode"
                class="delete-btn inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 bg-white border border-red-300 rounded hover:bg-red-50 hover:text-red-700 transition-colors"
                @click="emit('delete', $event, barcode.id)"
            >
                <TrashIcon class="w-6 h-6" />
                Delete
            </button>
        </div>
    </div>
</template>

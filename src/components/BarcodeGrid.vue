<script setup lang="ts">
import type { Barcode } from '../db'
import BarcodeCard from './BarcodeCard.vue'
import { QrCodeIcon } from '@heroicons/vue/24/outline'

defineProps<{
    barcodes: Barcode[]
    getTypeDef: (type: string) => { label: string; bcid: string } | undefined
}>()

const emit = defineEmits<{
    (e: 'edit', barcode: Barcode): void
    (e: 'delete', event: Event, id: string): void
    (e: 'scan', barcode: Barcode): void
}>()
</script>

<template>
    <div class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
        <BarcodeCard
            v-for="b in barcodes"
            :key="b.id"
            :barcode="b"
            :type-label="getTypeDef(b.type)?.label ?? b.type"
            :type-bcid="getTypeDef(b.type)?.bcid ?? b.type"
            @edit="emit('edit', $event)"
            @delete="(evt, id) => emit('delete', evt, id)"
            @scan="emit('scan', $event)"
        />

        <div
            v-if="barcodes.length === 0"
            class="col-span-full text-center py-16 px-4 text-slate-500 dark:text-slate-400"
        >
            <QrCodeIcon class="w-16 h-16 mx-auto mb-4 text-slate-400 dark:text-slate-500" />
            <p class="text-sm font-medium">
                No barcodes in this category. Click "+ New Barcode" to create one.
            </p>
        </div>
    </div>
</template>

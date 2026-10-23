<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import type { Barcode } from '../db'
import bwipjs from 'bwip-js'
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
    visible: boolean
    barcodes: Barcode[]
    currentIndex: number
    getTypeDef: (type: string) => { label: string; bcid: string } | undefined
}>()

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
    (e: 'update:currentIndex', value: number): void
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)

const currentBarcode = computed(() => props.barcodes[props.currentIndex] ?? null)
const currentTypeLabel = computed(
    () => props.getTypeDef(currentBarcode.value?.type ?? '')?.label ?? currentBarcode.value?.type ?? '',
)

const hasPrev = computed(() => props.currentIndex > 0)
const hasNext = computed(() => props.currentIndex < props.barcodes.length - 1)

const close = () => emit('update:visible', false)
const prev = () => {
    if (hasPrev.value) emit('update:currentIndex', props.currentIndex - 1)
}
const next = () => {
    if (hasNext.value) emit('update:currentIndex', props.currentIndex + 1)
}

const renderBarcode = () => {
    if (!canvasRef.value || !currentBarcode.value) return
    const typeDef = props.getTypeDef(currentBarcode.value.type)
    const bcid = typeDef?.bcid ?? currentBarcode.value.type

    const options: bwipjs.RenderOptions = {
        bcid,
        text: currentBarcode.value.value,
        scale: 5,
        includetext: false,
        ...(currentBarcode.value.type !== 'qrcode' ? { height: 20 } : {}),
    }

    try {
        bwipjs.toCanvas(canvasRef.value, options)
    } catch (err) {
        console.error('bwip-js scan modal error:', err)
    }
}

watch(
    () => [props.visible, props.currentIndex, props.barcodes],
    () => {
        if (props.visible) nextTick(renderBarcode)
    },
    { deep: true },
)

onMounted(() => {
    if (props.visible) nextTick(renderBarcode)
})

const onKey = (e: KeyboardEvent) => {
    if (!props.visible) return
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev() }
    if (e.key === 'ArrowRight') { e.preventDefault(); next() }
    if (e.key === 'Escape') close()
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
    <Teleport to="body">
        <Transition name="scan-modal">
            <div v-if="visible && currentBarcode"
                 class="fixed inset-0 z-60 flex items-center justify-center overflow-hidden bg-white backdrop-blur-sm"
                 @click.self="close">
                <!-- Close button -->
                <button type="button"
                        class="absolute top-5 right-5 flex items-center justify-center w-9 h-9 rounded-full border-none bg-white/10 text-slate-600 cursor-pointer transition-colors hover:bg-white/20 hover:text-slate-800"
                        aria-label="Close"
                        @click="close">
                    <XMarkIcon class="w-5 h-5" />
                </button>

                <!-- Content -->
                <div class="flex flex-col items-center gap-6 p-[100px] max-w-[80vw] max-h-[80dvh] bg-white overflow-hidden">
                    <!-- Value label -->
                    <p class="text-base text-slate-600 tracking-wide text-center break-all m-0">
                        {{ currentBarcode.value }}
                    </p>

                    <!-- Barcode canvas -->
                    <div class="bg-white rounded-xl p-6 flex items-center justify-center">
                        <canvas ref="canvasRef"
                                class="block max-w-[calc(100vw-448px)] max-h-[calc(100dvh-448px)] h-auto! w-auto!" />
                    </div>

                    <!-- Type label -->
                    <p class="text-xs text-slate-600 tracking-widest m-0">
                        {{ currentTypeLabel }}
                    </p>
                </div>

                <!-- Prev chevron -->
                <button v-if="hasPrev"
                        type="button"
                        class="absolute left-7 top-1/2 -translate-y-1/2 flex items-center justify-center w-11 h-11 rounded-full border border-white/15 bg-white/8 text-slate-600 cursor-pointer transition-colors hover:bg-white/18 hover:border-white/30 hover:text-slate-800"
                        aria-label="Previous barcode"
                        @click.stop="prev">
                    <ChevronLeftIcon class="w-6 h-6" />
                </button>

                <!-- Next chevron -->
                <button v-if="hasNext"
                        type="button"
                        class="absolute right-7 top-1/2 -translate-y-1/2 flex items-center justify-center w-11 h-11 rounded-full border border-white/15 bg-white/8 text-slate-600 cursor-pointer transition-colors hover:bg-white/18 hover:border-white/30 hover:text-slate-800"
                        aria-label="Next barcode"
                        @click.stop="next">
                    <ChevronRightIcon class="w-6 h-6" />
                </button>

                <!-- Pagination dots -->
                <div v-if="barcodes.length > 1"
                     class="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                    <span v-for="(_, i) in barcodes"
                          :key="i"
                          class="w-1.5 h-1.5 rounded-full transition-all duration-200"
                          :class="i === currentIndex ? 'bg-slate-600 scale-125' : 'bg-slate-600/25'"/>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
/* Vue named-transition hooks — can't be expressed with Tailwind utilities alone */
.scan-modal-enter-active,
.scan-modal-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
}

.scan-modal-enter-from,
.scan-modal-leave-to {
    opacity: 0;
    transform: scale(0.97);
}
</style>

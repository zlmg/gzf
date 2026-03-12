<script setup lang="ts">
import { useSwipe } from '@vueuse/core'
import { computed, onUnmounted, ref, watch } from 'vue'

const props = defineProps<{
  images: string[]
  title?: string
  initialIndex?: number
}>()

const emit = defineEmits<{
  close: []
}>()

const currentIndex = ref(props.initialIndex ?? 0)

// Scale and position for pinch zoom
const scale = ref(1)
const translateX = ref(0)
const translateY = ref(0)

// Touch state for pinch zoom
const lastTouchDistance = ref(0)
const isPinching = ref(false)
const containerRef = ref<HTMLElement | null>(null)

// Swipe handling
const { direction } = useSwipe(containerRef, {
  threshold: 50,
  onSwipeEnd() {
    if (isPinching.value || scale.value !== 1)
      return

    if (direction.value === 'left') {
      handleNext()
    }
    else if (direction.value === 'right') {
      handlePrev()
    }
  },
})

const parsedImages = computed(() => {
  if (!props.images || props.images.length === 0)
    return []
  return props.images
})

const canPrev = computed(() => currentIndex.value > 0)
const canNext = computed(() => currentIndex.value < parsedImages.value.length - 1)

const currentImage = computed(() => parsedImages.value[currentIndex.value] ?? '')

function handlePrev() {
  if (canPrev.value) {
    currentIndex.value--
    resetZoom()
  }
}

function handleNext() {
  if (canNext.value) {
    currentIndex.value++
    resetZoom()
  }
}

function resetZoom() {
  scale.value = 1
  translateX.value = 0
  translateY.value = 0
}

function handleClose() {
  emit('close')
}

// Get touch distance for pinch zoom
function getTouchDistance(touches: TouchList): number {
  if (touches.length < 2)
    return 0
  const touch0 = touches[0]
  const touch1 = touches[1]
  if (!touch0 || !touch1)
    return 0
  const dx = touch0.clientX - touch1.clientX
  const dy = touch0.clientY - touch1.clientY
  return Math.sqrt(dx * dx + dy * dy)
}

// Handle touch start for pinch zoom
function handleTouchStart(e: TouchEvent) {
  if (e.touches.length === 2) {
    isPinching.value = true
    lastTouchDistance.value = getTouchDistance(e.touches)
  }
}

// Handle touch move for pinch zoom
function handleTouchMove(e: TouchEvent) {
  if (e.touches.length === 2 && isPinching.value) {
    e.preventDefault()
    const newDistance = getTouchDistance(e.touches)
    const scaleDelta = newDistance / lastTouchDistance.value

    scale.value = Math.min(Math.max(scale.value * scaleDelta, 1), 4)
    lastTouchDistance.value = newDistance
  }
}

// Handle touch end
function handleTouchEnd() {
  isPinching.value = false

  // Snap back if scale is too small
  if (scale.value < 1) {
    resetZoom()
  }
}

// Mouse wheel zoom
function handleWheel(e: WheelEvent) {
  e.preventDefault()
  const delta = e.deltaY > 0 ? 0.9 : 1.1
  scale.value = Math.min(Math.max(scale.value * delta, 1), 4)
}

// Double tap to zoom
let lastTapTime = 0
function handleDoubleTap() {
  if (scale.value === 1) {
    scale.value = 2
  }
  else {
    resetZoom()
  }
}

function handleImageClick() {
  const now = Date.now()
  if (now - lastTapTime < 300) {
    handleDoubleTap()
  }
  lastTapTime = now
}

// Keyboard navigation
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft')
    handlePrev()
  if (e.key === 'ArrowRight')
    handleNext()
  if (e.key === 'Escape')
    handleClose()
  if (e.key === '0' || e.key === 'Home')
    resetZoom()
}

// Prevent body scroll when viewer is open
watch(() => true, () => {
  document.body.style.overflow = 'hidden'
  document.addEventListener('keydown', handleKeydown)
}, { immediate: true })

onUnmounted(() => {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', handleKeydown)
})

// Reset zoom when images change
watch(() => props.images, resetZoom)
watch(() => props.initialIndex, (val) => {
  if (val !== undefined)
    currentIndex.value = val
  resetZoom()
})
</script>

<template>
  <Teleport to="body">
    <Transition name="viewer-fade">
      <div
        v-show="true"
        ref="containerRef"
        class="fixed inset-0 z-50 bg-black/95 flex flex-col touch-pan-y select-none"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
        @wheel="handleWheel"
        @click.self="handleClose"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/70 to-transparent text-white shrink-0">
          <button
            class="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
            aria-label="关闭"
            @click="handleClose"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div class="flex-1 text-center min-w-0">
            <span v-if="title" class="text-sm truncate block max-w-[60%] mx-auto">{{ title }}</span>
          </div>
          <span class="text-sm shrink-0">{{ currentIndex + 1 }} / {{ parsedImages.length }}</span>
        </div>

        <!-- Image container -->
        <div class="flex-1 flex items-center justify-center overflow-hidden relative min-h-0">
          <TransitionGroup name="slide" tag="div" class="w-full h-full flex items-center justify-center">
            <img
              v-if="currentImage"
              :key="currentIndex"
              :src="currentImage"
              :alt="title || `图片 ${currentIndex + 1}`"
              class="max-h-full max-w-full object-contain transition-transform duration-100"
              :style="{
                transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
                transformOrigin: 'center center',
              }"
              draggable="false"
              @click="handleImageClick"
              @click.stop
            >
          </TransitionGroup>

          <!-- Navigation buttons (desktop) -->
          <button
            v-if="canPrev"
            class="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            aria-label="上一张"
            @click="handlePrev"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            v-if="canNext"
            class="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            aria-label="下一张"
            @click="handleNext"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <!-- Zoom controls -->
          <div class="absolute bottom-20 md:bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/50 rounded-full px-4 py-2">
            <button
              :disabled="scale <= 1"
              class="w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="缩小"
              @click="scale = Math.max(scale - 0.25, 1)"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
              </svg>
            </button>
            <span class="text-white text-sm min-w-[3rem] text-center">{{ Math.round(scale * 100) }}%</span>
            <button
              :disabled="scale >= 4"
              class="w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="放大"
              @click="scale = Math.min(scale + 0.25, 4)"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              v-if="scale !== 1"
              class="w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 rounded-full"
              aria-label="重置缩放"
              @click="resetZoom"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          <!-- Swipe indicator (mobile) -->
          <div
            v-if="parsedImages.length > 1"
            class="md:hidden absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5"
          >
            <span
              v-for="(_, index) in parsedImages"
              :key="index"
              class="w-1.5 h-1.5 rounded-full transition-all"
              :class="currentIndex === index ? 'bg-white w-4' : 'bg-white/50'"
            />
          </div>
        </div>

        <!-- Thumbnail strip -->
        <div
          v-if="parsedImages.length > 1"
          class="flex gap-2 px-4 py-3 overflow-x-auto bg-gradient-to-t from-black/70 to-transparent shrink-0"
        >
          <button
            v-for="(image, index) in parsedImages"
            :key="index"
            class="flex-shrink-0 w-16 h-12 rounded overflow-hidden border-2 transition-all"
            :class="currentIndex === index ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-white/30 hover:border-white/50'"
            @click="currentIndex = index; resetZoom()"
          >
            <img
              :src="image"
              :alt="`缩略图 ${index + 1}`"
              class="w-full h-full object-cover"
              loading="lazy"
            >
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Viewer fade transition */
.viewer-fade-enter-active,
.viewer-fade-leave-active {
  transition: opacity 0.3s ease;
}

.viewer-fade-enter-from,
.viewer-fade-leave-to {
  opacity: 0;
}

/* Slide transition for images */
.slide-enter-active,
.slide-leave-active {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
  position: absolute;
}

.slide-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

/* Ensure images don't have unwanted touch behaviors */
img {
  touch-action: pan-x pan-y;
}
</style>

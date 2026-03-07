<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { ElCarousel, ElCarouselItem } from 'element-plus'
import { useSwipe } from '@vueuse/core'

const props = defineProps<{
  images: string[]
  title?: string
}>()

const IMAGE_BASE_URL = 'https://www.bsgzf.com.cn'

const parsedImages = computed(() => {
  if (!props.images || props.images.length === 0) return []
  return props.images.map(img => {
    if (typeof img === 'string' && img.startsWith('http')) return img
    if (typeof img === 'string') return `${IMAGE_BASE_URL}${img}`
    return img
  })
})

const carouselIndex = ref(0)
const viewerIndex = ref(0)
const showViewer = ref(false)

// Reference for swipe container
const viewerRef = ref<HTMLElement | null>(null)

// Swipe gesture handling
const { direction } = useSwipe(viewerRef, {
  threshold: 50,
  onSwipeEnd() {
    if (direction.value === 'left') {
      handleNext()
    } else if (direction.value === 'right') {
      handlePrev()
    }
  }
})

const openViewer = (index: number) => {
  viewerIndex.value = index
  showViewer.value = true
}

const handlePrev = () => {
  if (viewerIndex.value > 0) {
    viewerIndex.value--
  }
}

const handleNext = () => {
  if (viewerIndex.value < parsedImages.value.length - 1) {
    viewerIndex.value++
  }
}

const handleKeydown = (e: KeyboardEvent) => {
  if (!showViewer.value) return
  if (e.key === 'ArrowLeft') handlePrev()
  if (e.key === 'ArrowRight') handleNext()
  if (e.key === 'Escape') showViewer.value = false
}

watch(showViewer, (val) => {
  if (val) {
    document.addEventListener('keydown', handleKeydown)
    document.body.style.overflow = 'hidden'
  } else {
    document.removeEventListener('keydown', handleKeydown)
    document.body.style.overflow = ''
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="gallery-container">
    <ElCarousel
      v-if="parsedImages.length > 0"
      :autoplay="false"
      indicator-position="outside"
      height="400px"
      class="rounded-lg overflow-hidden"
      v-model="carouselIndex"
    >
      <ElCarouselItem
        v-for="(image, index) in parsedImages"
        :key="index"
      >
        <div
          class="w-full h-full bg-gray-100 cursor-pointer"
          @click="openViewer(index)"
        >
          <img
            :src="image"
            :alt="title || `图片 ${index + 1}`"
            class="w-full h-full object-contain"
            loading="lazy"
          />
        </div>
      </ElCarouselItem>
    </ElCarousel>

    <div
      v-else
      class="w-full h-80 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400"
    >
      <svg class="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>

    <!-- Thumbnail strip -->
    <div
      v-if="parsedImages.length > 1"
      class="flex gap-2 mt-3 overflow-x-auto pb-2"
    >
      <div
        v-for="(image, index) in parsedImages"
        :key="index"
        class="flex-shrink-0 w-20 h-14 rounded overflow-hidden cursor-pointer border-2 transition-colors"
        :class="carouselIndex === index ? 'border-blue-500' : 'border-transparent hover:border-gray-300'"
        @click="carouselIndex = index"
      >
        <img
          :src="image"
          :alt="`缩略图 ${index + 1}`"
          class="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    </div>

    <!-- Fullscreen viewer with swipe support -->
    <Teleport to="body">
      <Transition name="viewer-fade">
        <div
          v-if="showViewer"
          ref="viewerRef"
          class="fixed inset-0 z-50 bg-black/95 flex flex-col touch-pan-y select-none"
          @click.self="showViewer = false"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-4 py-3 bg-black/50 text-white">
            <button
              @click="showViewer = false"
              class="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
              aria-label="关闭"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <span v-if="title" class="text-sm truncate max-w-[60%]">{{ title }}</span>
            <span class="text-sm">{{ viewerIndex + 1 }} / {{ parsedImages.length }}</span>
          </div>

          <!-- Image container with swipe -->
          <div
            class="flex-1 flex items-center justify-center overflow-hidden relative"
          >
            <TransitionGroup name="slide">
              <img
                :key="viewerIndex"
                :src="parsedImages[viewerIndex]"
                :alt="title || `图片 ${viewerIndex + 1}`"
                class="max-h-full max-w-full object-contain px-4"
                draggable="false"
              />
            </TransitionGroup>

            <!-- Navigation buttons (desktop) -->
            <button
              v-if="parsedImages.length > 1 && viewerIndex > 0"
              @click="handlePrev"
              class="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              aria-label="上一张"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              v-if="parsedImages.length > 1 && viewerIndex < parsedImages.length - 1"
              @click="handleNext"
              class="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              aria-label="下一张"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <!-- Swipe indicator (mobile) -->
            <div
              v-if="parsedImages.length > 1"
              class="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5"
            >
              <span
                v-for="(_, index) in parsedImages"
                :key="index"
                class="w-1.5 h-1.5 rounded-full transition-all"
                :class="viewerIndex === index ? 'bg-white w-4' : 'bg-white/50'"
              />
            </div>
          </div>

          <!-- Thumbnail strip in viewer -->
          <div
            v-if="parsedImages.length > 1"
            class="flex gap-2 px-4 py-3 overflow-x-auto bg-black/50"
          >
            <button
              v-for="(image, index) in parsedImages"
              :key="index"
              @click="viewerIndex = index"
              class="flex-shrink-0 w-16 h-12 rounded overflow-hidden border-2 transition-all"
              :class="viewerIndex === index ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-white/30 hover:border-white/50'"
            >
              <img
                :src="image"
                :alt="`缩略图 ${index + 1}`"
                class="w-full h-full object-cover"
              />
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.gallery-container :deep(.el-carousel__button) {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

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
  transition: transform 0.3s ease, opacity 0.3s ease;
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
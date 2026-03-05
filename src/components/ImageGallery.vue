<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElCarousel, ElCarouselItem, ElDialog } from 'element-plus'

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

const currentIndex = ref(0)
const showViewer = ref(false)

const openViewer = (index: number) => {
  currentIndex.value = index
  showViewer.value = true
}

const handlePrev = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

const handleNext = () => {
  if (currentIndex.value < parsedImages.value.length - 1) {
    currentIndex.value++
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
  } else {
    document.removeEventListener('keydown', handleKeydown)
  }
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
        :class="currentIndex === index ? 'border-blue-500' : 'border-transparent hover:border-gray-300'"
        @click="currentIndex = index"
      >
        <img
          :src="image"
          :alt="`缩略图 ${index + 1}`"
          class="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    </div>

    <!-- Fullscreen viewer -->
    <ElDialog
      v-model="showViewer"
      :title="title"
      width="90%"
      top="5vh"
      class="image-viewer-dialog"
      :close-on-click-modal="true"
    >
      <div class="relative bg-black rounded-lg overflow-hidden">
        <img
          :src="parsedImages[currentIndex]"
          :alt="title || `图片 ${currentIndex + 1}`"
          class="max-h-[70vh] mx-auto object-contain"
        />

        <!-- Navigation buttons -->
        <button
          v-if="parsedImages.length > 1"
          @click="handlePrev"
          :disabled="currentIndex === 0"
          class="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          v-if="parsedImages.length > 1"
          @click="handleNext"
          :disabled="currentIndex === parsedImages.length - 1"
          class="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <!-- Image counter -->
        <div class="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 text-white text-sm rounded-full">
          {{ currentIndex + 1 }} / {{ parsedImages.length }}
        </div>
      </div>
    </ElDialog>
  </div>
</template>

<style scoped>
.gallery-container :deep(.el-carousel__button) {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
</style>
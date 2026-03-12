<script setup lang="ts">
import { ElCarousel, ElCarouselItem } from 'element-plus'
import { computed, ref } from 'vue'
import ImageViewer from '@/components/ImageViewer.vue'
import { getImageUrl } from '@/config'

const props = defineProps<{
  images: string[]
  title?: string
}>()

const parsedImages = computed(() => {
  if (!props.images || props.images.length === 0)
    return []
  return props.images.map((img) => {
    if (typeof img === 'string' && img.startsWith('http'))
      return img
    if (typeof img === 'string')
      return getImageUrl(img)
    return img
  })
})

// Carousel 组件引用，用于调用 setActiveItem 方法
const carouselRef = ref<InstanceType<typeof ElCarousel> | null>(null)
const activeIndex = ref(0)

const showViewer = ref(false)
const viewerIndex = ref(0)

// 点击缩略图切换到对应图片
function handleThumbnailClick(index: number) {
  activeIndex.value = index
  carouselRef.value?.setActiveItem(index)
}

function openViewer(index: number) {
  viewerIndex.value = index
  showViewer.value = true
}

function closeViewer() {
  showViewer.value = false
}
</script>

<template>
  <div class="gallery-container">
    <ElCarousel
      v-if="parsedImages.length > 0"
      ref="carouselRef"
      :autoplay="false"
      indicator-position="outside"
      height="400px"
      class="rounded-lg overflow-hidden"
      @change="(current: number) => activeIndex = current"
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
          >
        </div>
      </ElCarouselItem>
    </ElCarousel>

    <div
      v-else
      class="w-full h-80 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400"
    >
      <svg class="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
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
        :class="activeIndex === index ? 'border-blue-500' : 'border-transparent hover:border-gray-300'"
        @click="handleThumbnailClick(index)"
      >
        <img
          :src="image"
          :alt="`缩略图 ${index + 1}`"
          class="w-full h-full object-cover"
          loading="lazy"
        >
      </div>
    </div>

    <!-- 使用统一的图片查看器组件 -->
    <ImageViewer
      v-if="showViewer"
      :images="parsedImages"
      :title="title"
      :initial-index="viewerIndex"
      @close="closeViewer"
    />
  </div>
</template>

<style scoped>
.gallery-container :deep(.el-carousel__button) {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
</style>

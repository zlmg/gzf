<script setup lang="ts">
import emblaCarouselVue from 'embla-carousel-vue'
import { computed, ref, watch } from 'vue'
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

// @ts-expect-error emblaRef is used in the template via ref="emblaRef"
const [emblaRef, emblaApi] = emblaCarouselVue({ loop: false })
const activeIndex = ref(0)

const showViewer = ref(false)
const viewerIndex = ref(0)

// Sync active index
watch(emblaApi, (api) => {
  if (api) {
    api.on('select', () => {
      activeIndex.value = api.selectedScrollSnap()
    })
  }
})

function scrollTo(index: number) {
  emblaApi.value?.scrollTo(index)
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
  <div v-if="parsedImages.length > 0" class="gallery-container">
    <!-- Carousel -->
    <div ref="emblaRef" class="overflow-hidden rounded-lg">
      <div class="flex">
        <div
          v-for="(image, index) in parsedImages"
          :key="index"
          class="flex-[0_0_100%] min-w-0"
        >
          <div
            class="h-[400px] bg-gray-100 cursor-pointer"
            @click="openViewer(index)"
          >
            <img
              :src="image"
              :alt="title || `图片 ${index + 1}`"
              class="w-full h-full object-contain"
              loading="lazy"
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Dot indicators -->
    <div v-if="parsedImages.length > 1" class="flex justify-center gap-2 mt-4">
      <button
        v-for="(_, index) in parsedImages"
        :key="index"
        class="w-2.5 h-2.5 rounded-full transition-colors"
        :class="activeIndex === index ? 'bg-blue-500' : 'bg-gray-300 hover:bg-gray-400'"
        @click="scrollTo(index)"
      />
    </div>

    <!-- Thumbnails -->
    <div v-if="parsedImages.length > 1" class="flex gap-2 mt-3 overflow-x-auto pb-2">
      <button
        v-for="(image, index) in parsedImages"
        :key="index"
        class="flex-shrink-0 w-20 h-14 rounded overflow-hidden border-2 transition-colors"
        :class="activeIndex === index ? 'border-blue-500' : 'border-transparent hover:border-gray-300'"
        @click="scrollTo(index)"
      >
        <img
          :src="image"
          :alt="`缩略图 ${index + 1}`"
          class="w-full h-full object-cover"
          loading="lazy"
        >
      </button>
    </div>

    <!-- Image Viewer -->
    <ImageViewer
      v-if="showViewer"
      :images="parsedImages"
      :title="title"
      :initial-index="viewerIndex"
      @close="closeViewer"
    />
  </div>

  <!-- Empty state -->
  <div
    v-else
    class="w-full h-80 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400"
  >
    <UIcon name="i-lucide-image" class="size-20" />
  </div>
</template>

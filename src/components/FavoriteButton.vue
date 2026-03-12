<script setup lang="ts">
import type { Property } from '@/types/property'
import { computed } from 'vue'
import { useFavoriteStore } from '@/stores/favorite'

const props = defineProps<{
  property: Property
  size?: 'small' | 'default' | 'large'
}>()

const emit = defineEmits<{
  (e: 'change', isFavorite: boolean): void
}>()

const favoriteStore = useFavoriteStore()

const isFavorite = computed(() => {
  return favoriteStore.isFavorite(props.property.projectNo)
})

function handleClick(e: Event) {
  e.preventDefault()
  e.stopPropagation()
  const result = favoriteStore.toggleFavorite(props.property)
  emit('change', result)
}

const sizeClass = computed(() => {
  switch (props.size) {
    case 'small':
      return 'w-4 h-4'
    case 'large':
      return 'w-6 h-6'
    default:
      return 'w-5 h-5'
  }
})
</script>

<template>
  <button
    type="button"
    class="p-1.5 rounded-full transition-all duration-200"
    :class="[
      isFavorite
        ? 'bg-red-50 hover:bg-red-100 active:bg-red-200'
        : 'bg-white/80 hover:bg-white active:bg-gray-100',
    ]"
    @click="handleClick"
  >
    <svg
      class="transition-transform duration-200" :class="[
        sizeClass,
        { 'scale-110': isFavorite },
        isFavorite ? 'text-red-500' : 'text-gray-400 hover:text-gray-600',
      ]"
      :fill="isFavorite ? 'currentColor' : 'none'"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  </button>
</template>

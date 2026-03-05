<script setup lang="ts">
import { computed } from 'vue'
import { useFavoriteStore } from '@/stores/favorite'
import type { Property } from '@/types/property'

const props = defineProps<{
  property: Property
  size?: 'small' | 'default' | 'large'
  showText?: boolean
}>()

const emit = defineEmits<{
  (e: 'change', isFavorite: boolean): void
}>()

const favoriteStore = useFavoriteStore()

const isFavorite = computed(() => {
  return favoriteStore.isFavorite(props.property.projectNo)
})

const handleClick = (e: Event) => {
  e.preventDefault()
  e.stopPropagation()
  const result = favoriteStore.toggleFavorite(props.property)
  emit('change', result)
}
</script>

<template>
  <button
    @click="handleClick"
    :class="[
      'favorite-btn inline-flex items-center justify-center rounded-lg transition-all duration-200',
      {
        'px-2 py-1 text-sm': size === 'small',
        'px-3 py-2 text-base': size === 'default' || !size,
        'px-4 py-3 text-lg': size === 'large',
        'is-favorite': isFavorite
      }
    ]"
    :title="isFavorite ? '取消收藏' : '添加收藏'"
  >
    <!-- Heart Icon -->
    <svg
      class="w-5 h-5 transition-transform duration-200"
      :class="{ 'scale-110': isFavorite }"
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
    <span v-if="showText" class="ml-2">
      {{ isFavorite ? '已收藏' : '收藏' }}
    </span>
  </button>
</template>

<style scoped>
.favorite-btn {
  background-color: #f3f4f6;
  color: #6b7280;
  border: 1px solid transparent;
}

.favorite-btn:hover {
  background-color: #fee2e2;
  color: #ef4444;
}

.favorite-btn.is-favorite {
  background-color: #fef2f2;
  color: #ef4444;
  border-color: #fecaca;
}

.favorite-btn.is-favorite:hover {
  background-color: #fee2e2;
}
</style>
<script setup lang="ts">
defineProps<{
  title?: string
  message?: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <UModal>
    <template #header>
      <h3 class="text-lg font-semibold">
        {{ title || '确认' }}
      </h3>
    </template>

    <template #body>
      <p class="text-gray-600">
        {{ message }}
      </p>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="ghost" @click="emit('cancel')">
          取消
        </UButton>
        <UButton color="primary" @click="emit('confirm')">
          确认
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAppToast } from '@/composables/useAppToast'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const toast = useAppToast()

const schema = z.object({
  username: z.string().min(3, '用户名长度为3-20个字符').max(20, '用户名长度为3-20个字符'),
  password: z.string().min(6, '密码至少6个字符'),
  confirmPassword: z.string().min(6, '密码至少6个字符'),
}).refine(data => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
})

type Schema = z.output<typeof schema>
const state = ref<Partial<Schema>>({
  username: '',
  password: '',
  confirmPassword: '',
})

async function onSubmit() {
  const result = await authStore.register(state.value.username ?? '', state.value.password ?? '')

  if (result.success) {
    toast.success('注册成功')
    router.push('/')
  }
  else {
    toast.error(result.message || '注册失败')
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          注册账号
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          注册后可跨设备同步收藏和浏览记录
        </p>
      </div>

      <UForm :schema="schema" :state="state" class="mt-8 space-y-6" @submit="onSubmit">
        <UFormField name="username" required>
          <UInput
            v-model="state.username"
            placeholder="用户名"
            size="lg"
          >
            <template #leading>
              <UIcon name="i-lucide-user" class="size-5" />
            </template>
          </UInput>
        </UFormField>

        <UFormField name="password" required>
          <UInput
            v-model="state.password"
            type="password"
            placeholder="密码"
            size="lg"
          >
            <template #leading>
              <UIcon name="i-lucide-lock" class="size-5" />
            </template>
          </UInput>
        </UFormField>

        <UFormField name="confirmPassword" required>
          <UInput
            v-model="state.confirmPassword"
            type="password"
            placeholder="确认密码"
            size="lg"
          >
            <template #leading>
              <UIcon name="i-lucide-lock" class="size-5" />
            </template>
          </UInput>
        </UFormField>

        <UButton
          type="submit"
          color="primary"
          size="lg"
          block
          :loading="authStore.loading"
        >
          注册
        </UButton>

        <div class="text-center">
          <RouterLink
            to="/login"
            class="text-sm text-blue-600 hover:text-blue-500"
          >
            已有账号？立即登录
          </RouterLink>
        </div>
      </UForm>
    </div>
  </div>
</template>

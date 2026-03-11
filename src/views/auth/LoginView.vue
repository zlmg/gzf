<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import type { LoginForm } from '@/types/user'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = reactive<LoginForm>({
  username: '',
  password: '',
  remember: false,
})

const loading = ref(false)
const formRef = ref()

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  loading.value = true
  try {
    const result = await authStore.login(form)
    if (result.success) {
      ElMessage.success(result.message)
      const redirect = route.query.redirect as string
      router.push(redirect || '/')
    } else {
      ElMessage.error(result.message)
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
    <div class="max-w-md w-full">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900">登录</h1>
        <p class="mt-2 text-gray-600">欢迎回来</p>
      </div>

      <el-card shadow="lg" class="rounded-xl">
        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="handleSubmit">
          <el-form-item label="用户名" prop="username">
            <el-input v-model="form.username" placeholder="请输入用户名" prefix-icon="User" size="large" />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              prefix-icon="Lock"
              size="large"
              show-password
            />
          </el-form-item>

          <el-form-item>
            <div class="flex items-center justify-between w-full">
              <el-checkbox v-model="form.remember">记住我</el-checkbox>
              <RouterLink to="/forgot-password" class="text-blue-600 hover:text-blue-800 text-sm">
                忘记密码？
              </RouterLink>
            </div>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" native-type="submit" :loading="loading" size="large" class="w-full">
              登录
            </el-button>
          </el-form-item>
        </el-form>

        <div class="text-center mt-4 pt-4 border-t border-gray-200">
          <span class="text-gray-600">还没有账号？</span>
          <RouterLink to="/register" class="text-blue-600 hover:text-blue-800 ml-1">立即注册</RouterLink>
        </div>
      </el-card>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import type { ResetPasswordForm } from '@/types/user'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive<ResetPasswordForm>({
  username: '',
  email: '',
  newPassword: '',
  confirmPassword: '',
})

const loading = ref(false)
const formRef = ref()

const validateConfirmPassword = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (value !== form.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' },
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少 6 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  loading.value = true
  try {
    const result = await authStore.resetPassword(form)
    if (result.success) {
      ElMessage.success(result.message)
      router.push('/login')
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
        <h1 class="text-3xl font-bold text-gray-900">找回密码</h1>
        <p class="mt-2 text-gray-600">请输入您的账号信息</p>
      </div>

      <el-card shadow="lg" class="rounded-xl">
        <el-alert type="info" :closable="false" class="mb-6">
          请输入注册时的用户名和邮箱，验证通过后可重置密码
        </el-alert>

        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="handleSubmit">
          <el-form-item label="用户名" prop="username">
            <el-input v-model="form.username" placeholder="请输入用户名" prefix-icon="User" size="large" />
          </el-form-item>

          <el-form-item label="邮箱" prop="email">
            <el-input v-model="form.email" placeholder="请输入注册时使用的邮箱" prefix-icon="Message" size="large" />
          </el-form-item>

          <el-form-item label="新密码" prop="newPassword">
            <el-input
              v-model="form.newPassword"
              type="password"
              placeholder="请输入新密码"
              prefix-icon="Lock"
              size="large"
              show-password
            />
          </el-form-item>

          <el-form-item label="确认新密码" prop="confirmPassword">
            <el-input
              v-model="form.confirmPassword"
              type="password"
              placeholder="请再次输入新密码"
              prefix-icon="Lock"
              size="large"
              show-password
            />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" native-type="submit" :loading="loading" size="large" class="w-full">
              重置密码
            </el-button>
          </el-form-item>
        </el-form>

        <div class="text-center mt-4 pt-4 border-t border-gray-200">
          <RouterLink to="/login" class="text-blue-600 hover:text-blue-800">返回登录</RouterLink>
        </div>
      </el-card>
    </div>
  </div>
</template>
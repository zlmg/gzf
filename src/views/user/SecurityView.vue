<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import type { ChangePasswordForm } from '@/types/user'

const authStore = useAuthStore()

const form = reactive<ChangePasswordForm>({
  currentPassword: '',
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
  currentPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少 6 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
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
    const result = await authStore.changePassword(form)
    if (result.success) {
      ElMessage.success(result.message)
      // 清空表单
      form.currentPassword = ''
      form.newPassword = ''
      form.confirmPassword = ''
    } else {
      ElMessage.error(result.message)
    }
  } finally {
    loading.value = false
  }
}

function handleLogout() {
  authStore.logout()
  ElMessage.success('已退出登录')
}
</script>

<template>
  <div class="space-y-6">
    <!-- 修改密码 -->
    <el-card shadow="sm" class="rounded-xl">
      <template #header>
        <h2 class="text-xl font-semibold text-gray-900">修改密码</h2>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" class="max-w-lg">
        <el-form-item label="当前密码" prop="currentPassword">
          <el-input
            v-model="form.currentPassword"
            type="password"
            placeholder="请输入当前密码"
            show-password
          />
        </el-form-item>

        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="form.newPassword" type="password" placeholder="请输入新密码" show-password />
        </el-form-item>

        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSubmit">修改密码</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 危险操作 -->
    <el-card shadow="sm" class="rounded-xl">
      <template #header>
        <h2 class="text-xl font-semibold text-red-600">危险操作</h2>
      </template>

      <div class="flex items-center justify-between">
        <div>
          <h3 class="font-medium text-gray-900">退出登录</h3>
          <p class="text-sm text-gray-500 mt-1">退出当前账号，需要重新登录</p>
        </div>
        <el-button type="danger" plain @click="handleLogout">退出登录</el-button>
      </div>
    </el-card>
  </div>
</template>
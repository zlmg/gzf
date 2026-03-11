<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import type { UpdateProfileForm } from '@/types/user'

const authStore = useAuthStore()

const form = reactive<UpdateProfileForm>({
  nickname: authStore.user?.nickname || '',
  avatar: authStore.user?.avatar || '',
})

const loading = ref(false)
const formRef = ref()

const rules = {
  nickname: [
    { max: 20, message: '昵称最长 20 个字符', trigger: 'blur' },
  ],
}

function handleSubmit() {
  formRef.value?.validate(async (valid: boolean) => {
    if (!valid) return

    loading.value = true
    try {
      const result = authStore.updateProfile(form)
      if (result.success) {
        ElMessage.success(result.message)
      } else {
        ElMessage.error(result.message)
      }
    } finally {
      loading.value = false
    }
  })
}
</script>

<template>
  <el-card shadow="sm" class="rounded-xl">
    <template #header>
      <h2 class="text-xl font-semibold text-gray-900">个人信息</h2>
    </template>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" class="max-w-lg">
      <el-form-item label="用户名">
        <el-input :value="authStore.username" disabled />
      </el-form-item>

      <el-form-item label="邮箱">
        <el-input :value="authStore.user?.email" disabled />
      </el-form-item>

      <el-form-item label="昵称" prop="nickname">
        <el-input v-model="form.nickname" placeholder="请输入昵称" maxlength="20" show-word-limit />
      </el-form-item>

      <el-form-item label="头像URL" prop="avatar">
        <el-input v-model="form.avatar" placeholder="请输入头像图片URL" />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" :loading="loading" @click="handleSubmit">保存修改</el-button>
      </el-form-item>
    </el-form>

    <!-- 账号信息 -->
    <div class="mt-6 pt-6 border-t border-gray-200">
      <h3 class="text-sm font-medium text-gray-500 mb-4">账号信息</h3>
      <div class="space-y-2 text-sm text-gray-600">
        <p>注册时间：{{ new Date(authStore.user?.createdAt || 0).toLocaleDateString('zh-CN') }}</p>
        <p>最后更新：{{ new Date(authStore.user?.updatedAt || 0).toLocaleDateString('zh-CN') }}</p>
      </div>
    </div>
  </el-card>
</template>
/**
 * 认证状态管理
 */

import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { User, UserStored, LoginForm, RegisterForm, ResetPasswordForm, ChangePasswordForm, UpdateProfileForm } from '@/types/user'
import { generateSalt, hashPassword, verifyPassword } from '@/utils/crypto'
import { generateToken, saveToken, getStoredToken, removeToken, getUserIdFromToken, validateToken } from '@/utils/token'

const USERS_KEY = 'gzf-users'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const loading = ref(false)

  /** 是否已登录 */
  const isAuthenticated = computed(() => !!user.value && !!token.value)

  /** 用户名 */
  const username = computed(() => user.value?.username ?? '')

  /** 获取所有用户 */
  function getAllUsers(): UserStored[] {
    try {
      const data = localStorage.getItem(USERS_KEY)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  }

  /** 保存所有用户 */
  function saveAllUsers(users: UserStored[]): void {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  }

  /** 根据用户名查找用户 */
  function findUserByUsername(username: string): UserStored | undefined {
    return getAllUsers().find((u) => u.username === username)
  }

  /** 根据邮箱查找用户 */
  function findUserByEmail(email: string): UserStored | undefined {
    return getAllUsers().find((u) => u.email === email)
  }

  /** 根据 ID 查找用户 */
  function findUserById(id: string): UserStored | undefined {
    return getAllUsers().find((u) => u.id === id)
  }

  /** 生成用户 ID */
  function generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
  }

  /** 注册 */
  async function register(form: RegisterForm): Promise<{ success: boolean; message: string }> {
    const { username, email, password, confirmPassword } = form

    // 验证
    if (!username || !email || !password) {
      return { success: false, message: '请填写所有必填项' }
    }

    if (password !== confirmPassword) {
      return { success: false, message: '两次输入的密码不一致' }
    }

    if (password.length < 6) {
      return { success: false, message: '密码长度至少 6 位' }
    }

    if (findUserByUsername(username)) {
      return { success: false, message: '用户名已存在' }
    }

    if (findUserByEmail(email)) {
      return { success: false, message: '邮箱已被注册' }
    }

    // 创建用户
    const salt = generateSalt()
    const passwordHash = await hashPassword(password, salt)
    const now = Date.now()
    const newUser: UserStored = {
      id: generateUserId(),
      username,
      email,
      passwordHash,
      salt,
      createdAt: now,
      updatedAt: now,
    }

    // 保存用户
    const users = getAllUsers()
    users.push(newUser)
    saveAllUsers(users)

    return { success: true, message: '注册成功' }
  }

  /** 登录 */
  async function login(form: LoginForm): Promise<{ success: boolean; message: string }> {
    const { username, password } = form

    if (!username || !password) {
      return { success: false, message: '请输入用户名和密码' }
    }

    const foundUser = findUserByUsername(username)
    if (!foundUser) {
      return { success: false, message: '用户名或密码错误' }
    }

    const isValid = await verifyPassword(password, foundUser.passwordHash, foundUser.salt)
    if (!isValid) {
      return { success: false, message: '用户名或密码错误' }
    }

    // 生成 token
    const newToken = generateToken(foundUser.id, foundUser.username)
    token.value = newToken
    saveToken(newToken)

    // 设置用户信息（不包含敏感信息）
    user.value = {
      id: foundUser.id,
      username: foundUser.username,
      email: foundUser.email,
      nickname: foundUser.nickname,
      avatar: foundUser.avatar,
      createdAt: foundUser.createdAt,
      updatedAt: foundUser.updatedAt,
    }

    return { success: true, message: '登录成功' }
  }

  /** 登出 */
  function logout(): void {
    user.value = null
    token.value = null
    removeToken()
  }

  /** 重置密码 */
  async function resetPassword(form: ResetPasswordForm): Promise<{ success: boolean; message: string }> {
    const { username, email, newPassword, confirmPassword } = form

    if (!username || !email || !newPassword) {
      return { success: false, message: '请填写所有必填项' }
    }

    if (newPassword !== confirmPassword) {
      return { success: false, message: '两次输入的密码不一致' }
    }

    if (newPassword.length < 6) {
      return { success: false, message: '密码长度至少 6 位' }
    }

    const foundUser = findUserByUsername(username)
    if (!foundUser) {
      return { success: false, message: '用户名不存在' }
    }

    if (foundUser.email !== email) {
      return { success: false, message: '邮箱与用户名不匹配' }
    }

    // 更新密码
    const newSalt = generateSalt()
    const passwordHash = await hashPassword(newPassword, newSalt)
    const users = getAllUsers()
    const index = users.findIndex((u) => u.id === foundUser.id)
    if (index !== -1) {
      users[index] = {
        id: foundUser.id,
        username: foundUser.username,
        email: foundUser.email,
        nickname: foundUser.nickname,
        avatar: foundUser.avatar,
        createdAt: foundUser.createdAt,
        passwordHash,
        salt: newSalt,
        updatedAt: Date.now(),
      }
      saveAllUsers(users)
    }

    return { success: true, message: '密码重置成功' }
  }

  /** 修改密码 */
  async function changePassword(form: ChangePasswordForm): Promise<{ success: boolean; message: string }> {
    const { currentPassword, newPassword, confirmPassword } = form

    if (!currentPassword || !newPassword) {
      return { success: false, message: '请填写所有必填项' }
    }

    if (newPassword !== confirmPassword) {
      return { success: false, message: '两次输入的新密码不一致' }
    }

    if (newPassword.length < 6) {
      return { success: false, message: '密码长度至少 6 位' }
    }

    if (!user.value) {
      return { success: false, message: '请先登录' }
    }

    const foundUser = findUserById(user.value.id)
    if (!foundUser) {
      return { success: false, message: '用户不存在' }
    }

    const isValid = await verifyPassword(currentPassword, foundUser.passwordHash, foundUser.salt)
    if (!isValid) {
      return { success: false, message: '当前密码错误' }
    }

    // 更新密码
    const newSalt = generateSalt()
    const passwordHash = await hashPassword(newPassword, newSalt)
    const users = getAllUsers()
    const index = users.findIndex((u) => u.id === user.value!.id)
    if (index !== -1) {
      const existing = users[index]!
      users[index] = {
        id: existing.id,
        username: existing.username,
        email: existing.email,
        nickname: existing.nickname,
        avatar: existing.avatar,
        createdAt: existing.createdAt,
        passwordHash,
        salt: newSalt,
        updatedAt: Date.now(),
      }
      saveAllUsers(users)
    }

    return { success: true, message: '密码修改成功' }
  }

  /** 更新用户信息 */
  function updateProfile(form: UpdateProfileForm): { success: boolean; message: string } {
    if (!user.value) {
      return { success: false, message: '请先登录' }
    }

    const users = getAllUsers()
    const index = users.findIndex((u) => u.id === user.value!.id)
    if (index === -1) {
      return { success: false, message: '用户不存在' }
    }

    const now = Date.now()
    const existing = users[index]!
    users[index] = {
      id: existing.id,
      username: existing.username,
      email: existing.email,
      createdAt: existing.createdAt,
      passwordHash: existing.passwordHash,
      salt: existing.salt,
      nickname: form.nickname ?? existing.nickname,
      avatar: form.avatar ?? existing.avatar,
      updatedAt: now,
    }
    saveAllUsers(users)

    // 更新当前用户状态
    user.value = {
      id: user.value.id,
      username: user.value.username,
      email: user.value.email,
      createdAt: user.value.createdAt,
      nickname: form.nickname ?? user.value.nickname,
      avatar: form.avatar ?? user.value.avatar,
      updatedAt: now,
    }

    return { success: true, message: '更新成功' }
  }

  /** 初始化认证状态（从 localStorage 恢复） */
  function initAuth(): void {
    const storedToken = getStoredToken()
    if (!storedToken || !validateToken(storedToken)) {
      removeToken()
      return
    }

    const userId = getUserIdFromToken(storedToken)
    if (!userId) {
      removeToken()
      return
    }

    const foundUser = findUserById(userId)
    if (!foundUser) {
      removeToken()
      return
    }

    token.value = storedToken
    user.value = {
      id: foundUser.id,
      username: foundUser.username,
      email: foundUser.email,
      nickname: foundUser.nickname,
      avatar: foundUser.avatar,
      createdAt: foundUser.createdAt,
      updatedAt: foundUser.updatedAt,
    }
  }

  return {
    user,
    token,
    loading,
    isAuthenticated,
    username,
    register,
    login,
    logout,
    resetPassword,
    changePassword,
    updateProfile,
    initAuth,
  }
})
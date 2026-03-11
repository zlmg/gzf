/**
 * 用户相关类型定义
 */

/** 用户信息 */
export interface User {
  id: string
  username: string
  email: string
  nickname?: string
  avatar?: string
  createdAt: number
  updatedAt: number
}

/** 用户存储数据（含密码哈希） */
export interface UserStored extends User {
  passwordHash: string
  salt: string
}

/** 登录表单 */
export interface LoginForm {
  username: string
  password: string
  remember?: boolean
}

/** 注册表单 */
export interface RegisterForm {
  username: string
  email: string
  password: string
  confirmPassword: string
}

/** 找回密码表单 */
export interface ResetPasswordForm {
  username: string
  email: string
  newPassword: string
  confirmPassword: string
}

/** 修改密码表单 */
export interface ChangePasswordForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

/** 更新用户信息表单 */
export interface UpdateProfileForm {
  nickname?: string
  avatar?: string
}

/** Token 载荷 */
export interface TokenPayload {
  userId: string
  username: string
  iat: number
  exp: number
}

/** 认证状态 */
export interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
}
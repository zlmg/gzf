/**
 * Token 工具
 * 简单的 Token 生成和验证
 */

import type { TokenPayload } from '@/types/user'

const TOKEN_KEY = 'gzf-auth-token'
const TOKEN_EXPIRE_DAYS = 7

/**
 * 生成 Token
 */
export function generateToken(userId: string, username: string): string {
  const now = Date.now()
  const payload: TokenPayload = {
    userId,
    username,
    iat: now,
    exp: now + TOKEN_EXPIRE_DAYS * 24 * 60 * 60 * 1000,
  }
  const json = JSON.stringify(payload)
  return btoa(encodeURIComponent(json))
}

/**
 * 解析 Token
 */
export function parseToken(token: string): TokenPayload | null {
  try {
    const json = decodeURIComponent(atob(token))
    return JSON.parse(json) as TokenPayload
  } catch {
    return null
  }
}

/**
 * 验证 Token 是否有效
 */
export function validateToken(token: string): boolean {
  const payload = parseToken(token)
  if (!payload) return false
  return payload.exp > Date.now()
}

/**
 * 从 Token 获取用户 ID
 */
export function getUserIdFromToken(token: string): string | null {
  const payload = parseToken(token)
  return payload?.userId ?? null
}

/**
 * 保存 Token 到 localStorage
 */
export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

/**
 * 获取存储的 Token
 */
export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * 移除存储的 Token
 */
export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}
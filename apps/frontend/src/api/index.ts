import type { AuthResponse, FavoriteItem, HistoryItem, Preferences, SyncResponse, UserDataResponse } from '@/types/user'
import type { PoiItem } from '@/composables/usePoiCache'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001'

// POI 搜索响应接口
export interface PoiSearchResponse {
  success: boolean
  data: {
    pois: PoiItem[]
    searchRadius: number
    fromCache: boolean
  }
  message?: string
}

class ApiError extends Error {
  status: number
  data?: unknown

  constructor(message: string, status: number, data?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem('gzf-token')

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new ApiError(
      data.message || '请求失败',
      response.status,
      data,
    )
  }

  return data
}

// 认证 API
export const authApi = {
  register: (username: string, password: string) =>
    request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  login: (username: string, password: string) =>
    request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
}

// 用户数据 API
export const userApi = {
  getData: () =>
    request<UserDataResponse>('/api/user/data'),

  syncFavorites: (favorites: FavoriteItem[]) =>
    request<SyncResponse>('/api/user/favorites', {
      method: 'PUT',
      body: JSON.stringify({ favorites }),
    }),

  syncHistory: (history: HistoryItem[]) =>
    request<SyncResponse>('/api/user/history', {
      method: 'PUT',
      body: JSON.stringify({ history }),
    }),

  syncPreferences: (preferences: Preferences) =>
    request<SyncResponse>('/api/user/preferences', {
      method: 'PUT',
      body: JSON.stringify({ preferences }),
    }),
}

// POI API
export const poiApi = {
  search: (latitude: number | string, longitude: number | string, category: string) =>
    request<PoiSearchResponse>(`/api/poi/search?latitude=${latitude}&longitude=${longitude}&category=${category}`),
}

export { ApiError }

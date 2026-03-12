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

// 管理员 API 响应类型
export interface ImportResponse {
  success: boolean
  message: string
  data: {
    usersImported: number
    usersSkipped: number
    poisImported: number
    poisSkipped: number
  }
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

// 管理员 API
export const adminApi = {
  // 导出数据库
  exportDatabase: async (): Promise<void> => {
    const token = localStorage.getItem('gzf-token')
    const response = await fetch(`${API_BASE}/api/admin/export`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) {
      const data = await response.json()
      throw new ApiError(data.message || '导出失败', response.status)
    }

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const filename = response.headers.get('content-disposition')?.match(/filename="(.+)"/)?.[1] || 'export.zip'
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  },

  // 导入数据库
  importDatabase: async (file: File): Promise<ImportResponse> => {
    const token = localStorage.getItem('gzf-token')
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_BASE}/api/admin/import`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new ApiError(data.message || '导入失败', response.status, data)
    }

    return data
  },
}

export { ApiError }

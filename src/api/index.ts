import type { AuthResponse, UserDataResponse, SyncResponse, FavoriteItem, HistoryItem, Preferences } from '@/types/user'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001'

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('gzf-token')

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers
  }

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  })

  const data = await response.json()

  if (!response.ok) {
    throw new ApiError(
      data.message || '请求失败',
      response.status,
      data
    )
  }

  return data
}

// 认证 API
export const authApi = {
  register: (username: string, password: string) =>
    request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),

  login: (username: string, password: string) =>
    request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    })
}

// 用户数据 API
export const userApi = {
  getData: () =>
    request<UserDataResponse>('/api/user/data'),

  syncFavorites: (favorites: FavoriteItem[]) =>
    request<SyncResponse>('/api/user/favorites', {
      method: 'PUT',
      body: JSON.stringify({ favorites })
    }),

  syncHistory: (history: HistoryItem[]) =>
    request<SyncResponse>('/api/user/history', {
      method: 'PUT',
      body: JSON.stringify({ history })
    }),

  syncPreferences: (preferences: Preferences) =>
    request<SyncResponse>('/api/user/preferences', {
      method: 'PUT',
      body: JSON.stringify({ preferences })
    })
}

export { ApiError }
import type { FilterState, RoomTypeDetail, SortField, SortOrder } from './property'

// ============ 用户信息 ============
export interface User {
  id: number
  username: string
}

// ============ 收藏相关类型 ============
export interface FavoriteItem {
  projectNo: string
  projectName: string
  location: string
  layout: string
  roomType: string
  minRent: number
  maxRent: number
  thumbnail: string
  kezuCount: number
  openQueue: string
  addedAt: number
  district?: string
  houseType?: string
  totalCount?: string
  openingDate?: string
  totalArea?: string
  houseSource?: string
  roomTypeDetails?: RoomTypeDetail[]
}

// ============ 浏览记录相关类型 ============
export interface HistoryItem {
  projectNo: string
  projectName: string
  location: string
  layout: string
  roomType: string
  minRent: number
  maxRent: number
  thumbnail: string
  kezuCount: number
  openQueue: string
  viewedAt: number
  district?: string
  houseType?: string
  totalCount?: string
  openingDate?: string
  totalArea?: string
  houseSource?: string
  roomTypeDetails?: RoomTypeDetail[]
}

// ============ 筛选偏好相关类型 ============
export interface SortState {
  field: SortField
  order: SortOrder
}

export interface Preferences {
  filters: FilterState
  sort: SortState
}

// ============ 认证响应 ============
export interface AuthResponse {
  success: boolean
  message: string
  token?: string
  user?: User
}

// ============ 用户数据响应 ============
export interface UserDataResponse {
  success: boolean
  data: {
    favorites: FavoriteItem[]
    history: HistoryItem[]
    preferences: Preferences
  }
}

// ============ 同步响应 ============
export interface SyncResponse {
  success: boolean
  message: string
}

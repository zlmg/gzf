import type { FilterState, RoomTypeDetail, SortField, SortOrder } from './property'

// ============ 用户信息 ============
export interface User {
  id: number
  username: string
}

// ============ 收藏相关类型 ============
// 简化存储类型（只存储 projectNo + 时间戳）
export interface FavoriteRef {
  projectNo: string
  addedAt: number
}

// 完整收藏类型（向后兼容，用于 v1.0 导入和云端旧数据）
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
// 简化存储类型（只存储 projectNo + 时间戳）
export interface HistoryRef {
  projectNo: string
  viewedAt: number
}

// 完整浏览记录类型（向后兼容）
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

// 导出数据结构 v2.0（简化格式）
export interface FavoriteExportDataV2 {
  version: '2.0'
  exportTime: number
  totalCount: number
  entries: FavoriteRef[]
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

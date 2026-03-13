import type { FastifyRequest } from 'fastify'
import type { User } from '@prisma/client'

// ============ 收藏相关类型 ============
// 简化存储类型（只存储 projectNo + 时间戳）
export interface FavoriteRef {
  projectNo: string
  addedAt: number
}

// 完整收藏类型（向后兼容）
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
  addedAt: number // timestamp
  // 可选字段
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
  viewedAt: number  // 浏览时间戳（毫秒）
  // 可选字段
  district?: string
  houseType?: string
  totalCount?: string
  openingDate?: string
  totalArea?: string
  houseSource?: string
  roomTypeDetails?: RoomTypeDetail[]
}

// ============ 户型详情类型 ============
export interface HouseType {
  area: string
  vrUrl: string
  roomPicUrl: string
  roomDescription: string
  roomLabel: string
  houseTypeName: string
  roomEquipment: string
  towards: string
  roomType: string
}

export interface RoomTypeDetail {
  queueCount: number
  maxRent: number
  minRent: number
  totalCount: number
  kezuCount: number
  houseTypeList: HouseType[]
}

// ============ 筛选偏好相关类型 ============
export type SortField = 'minPrice' | 'maxPrice' | 'kezuCount' | 'openingDate' | 'minArea' | 'maxArea' | ''
export type SortOrder = 'asc' | 'desc'

export interface FilterState {
  layout: string[]
  roomType: string[]
  priceRange: [number, number]
  keyword: string
  availableStatus: '' | 'available' | 'unavailable'
  openStatus: '' | 'open' | 'closed'
  equipment: string[]
  label: string[]
  areaRange: [number, number]
  towards: string[]
  excludeLayout: boolean
  excludeRoomType: boolean
  excludeEquipment: boolean
  excludeLabel: boolean
  excludeTowards: boolean
}

export interface SortState {
  field: SortField
  order: SortOrder
}

export interface Preferences {
  filters: FilterState
  sort: SortState
}

// ============ 请求体类型 ============
export interface RegisterBody {
  username: string
  password: string
}

export interface LoginBody {
  username: string
  password: string
}

export interface SyncFavoritesBody {
  favorites: FavoriteRef[]
}

export interface SyncHistoryBody {
  history: HistoryRef[]
}

export interface SyncPreferencesBody {
  preferences: Preferences
}

// 扩展 Fastify 类型
declare module 'fastify' {
  interface FastifyRequest {
    user?: Pick<User, 'id' | 'username'>
  }
}

// ============ 响应类型 ============
export interface AuthResponse {
  success: boolean
  message: string
  token?: string
  user?: {
    id: number
    username: string
  }
}

export interface UserDataResponse {
  success: boolean
  data: {
    favorites: FavoriteRef[]
    history: HistoryRef[]
    preferences: Preferences
  }
}

export interface SyncResponse {
  success: boolean
  message: string
}
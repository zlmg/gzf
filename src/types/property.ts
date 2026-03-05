export interface Property {
  projectNo: string
  projectName: string
  location: string
  layout: string           // 区域
  roomType: string         // 户型 (一,二,三,四)
  minRent: number
  maxRent: number
  thumbnail: string        // 逗号分隔的图片路径
  mediaUrl: string
  latitude: string
  longitude: string
  kezuCount: number        // 可租数量
  openQueue: string        // 是否开放
}

export interface FilterState {
  layout: string[]         // 区域筛选
  roomType: string[]       // 户型筛选
  priceRange: [number, number]  // 价格区间
  keyword: string          // 关键词搜索
  onlyAvailable: boolean   // 仅显示可租
}

export interface CompareItem extends Property {
  images: string[]         // 解析后的图片数组
}

export type SortField = 'price' | 'kezuCount' | ''
export type SortOrder = 'asc' | 'desc'
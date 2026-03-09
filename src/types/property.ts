// 户型详情（房型列表项）
export interface HouseType {
  area: string           // 面积
  vrUrl: string          // VR链接
  roomPicUrl: string     // 户型图片
  roomDescription: string // 描述
  roomLabel: string      // 标签（独立阳台,独立卫生间...）
  houseTypeName: string  // 户型名称
  roomEquipment: string  // 设备（床,衣柜,空调...）
  towards: string        // 朝向
  roomType: string       // 户型代码（101, 111, 211）
}

// 户型详情分组
export interface RoomTypeDetail {
  queueCount: number     // 排队人数
  maxRent: number        // 最高租金
  minRent: number        // 最低租金
  totalCount: number     // 总套数
  kezuCount: number      // 可租套数
  houseTypeList: HouseType[]
}

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
  // 新增字段
  district: string         // 行政区
  openingDate: string      // 供应日期
  houseType: string        // 房屋类型
  houseSource: string      // 房屋来源
  supply: string           // 供应对象
  totalCount: string       // 总套数
  totalArea: string        // 总面积
  textContent: string      // 项目介绍
  roomTypeCount: string    // 户型统计
  roomTypeDetails: RoomTypeDetail[]  // 户型详情
}

export type OpenStatus = '' | 'open' | 'closed'
export type AvailableStatus = '' | 'available' | 'unavailable'

export interface FilterState {
  layout: string[]         // 区域筛选
  roomType: string[]       // 户型筛选
  priceRange: [number, number]  // 价格区间
  keyword: string          // 关键词搜索
  availableStatus: AvailableStatus   // 可租状态筛选
  openStatus: OpenStatus   // 开放状态筛选
  // 新增筛选字段
  equipment: string[]      // 设备筛选
  label: string[]          // 标签筛选
  areaRange: [number, number]  // 面积区间
  towards: string[]        // 朝向筛选
  // 反向筛选标记
  excludeLayout: boolean   // 反向筛选区域
  excludeRoomType: boolean // 反向筛选户型
  excludeEquipment: boolean // 反向筛选设备
  excludeLabel: boolean    // 反向筛选标签
  excludeTowards: boolean  // 反向筛选朝向
}

export interface CompareItem extends Property {
  images: string[]         // 解析后的图片数组
}

export type SortField = 'price' | 'kezuCount' | 'openingDate' | ''
export type SortOrder = 'asc' | 'desc'
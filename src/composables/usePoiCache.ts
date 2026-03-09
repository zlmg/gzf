import { storage } from '@/utils/storage'

// POI 数据项接口
export interface PoiItem {
  id: string
  name: string
  address: string
  distance: string
  type: string
  location: string
  tel: string
}

// 缓存条目接口
export interface PoiCacheEntry {
  timestamp: number      // 缓存创建时间
  pois: PoiItem[]        // POI 数据数组
  searchRadius: number   // 实际搜索半径
  location: string       // 原始搜索位置 "lng,lat"
}

// 缓存过期时间：90天
const CACHE_TTL = 90 * 24 * 60 * 60 * 1000

// 缓存 key 前缀
const CACHE_PREFIX = 'poi-cache-'

/**
 * 生成缓存 key
 * 坐标取3位小数（约111米精度），相近位置共享缓存
 */
function generateKey(
  latitude: number | string,
  longitude: number | string,
  category: string,
  radius: number
): string {
  const lat = Number(latitude).toFixed(3)
  const lng = Number(longitude).toFixed(3)
  return `${CACHE_PREFIX}${lat}-${lng}-${category}-${radius}`
}

/**
 * 检查缓存是否过期
 */
function isExpired(timestamp: number): boolean {
  return Date.now() - timestamp > CACHE_TTL
}

/**
 * POI 缓存 Composable
 */
export function usePoiCache() {
  /**
   * 获取缓存的 POI 数据
   * @returns 缓存数据，如果不存在或已过期则返回 null
   */
  const getCached = (
    latitude: number | string,
    longitude: number | string,
    category: string,
    radius: number
  ): PoiCacheEntry | null => {
    const key = generateKey(latitude, longitude, category, radius)

    try {
      const entry = storage.get<PoiCacheEntry>(key)

      if (!entry) {
        return null
      }

      // 检查是否过期
      if (isExpired(entry.timestamp)) {
        storage.remove(key)
        return null
      }

      return entry
    } catch {
      // 数据损坏时删除
      storage.remove(key)
      return null
    }
  }

  /**
   * 保存 POI 数据到缓存
   */
  const setCached = (
    latitude: number | string,
    longitude: number | string,
    category: string,
    radius: number,
    pois: PoiItem[],
    searchRadius: number,
    location: string
  ): void => {
    const key = generateKey(latitude, longitude, category, radius)

    const entry: PoiCacheEntry = {
      timestamp: Date.now(),
      pois,
      searchRadius,
      location
    }

    try {
      storage.set(key, entry)
    } catch (e) {
      console.error('Failed to cache POI data:', e)
    }
  }

  /**
   * 清除指定位置的 POI 缓存
   */
  const clearCache = (
    latitude: number | string,
    longitude: number | string,
    category?: string,
    radius?: number
  ): void => {
    if (category && radius) {
      // 清除特定缓存
      const key = generateKey(latitude, longitude, category, radius)
      storage.remove(key)
    } else {
      // 清除该位置的所有缓存（遍历所有分类和半径）
      const lat = Number(latitude).toFixed(3)
      const lng = Number(longitude).toFixed(3)
      const prefix = `${CACHE_PREFIX}${lat}-${lng}-`

      // 遍历 localStorage 删除匹配的 key
      try {
        const keys = Object.keys(localStorage)
        keys.forEach(key => {
          if (key.includes(prefix)) {
            localStorage.removeItem(key)
          }
        })
      } catch (e) {
        console.error('Failed to clear POI cache:', e)
      }
    }
  }

  return {
    getCached,
    setCached,
    clearCache,
    isExpired
  }
}
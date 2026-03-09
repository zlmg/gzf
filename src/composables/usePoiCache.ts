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

// 导出数据结构
export interface PoiExportData {
  version: string        // 版本号 "1.0"
  exportTime: number     // 导出时间戳
  totalCount: number     // 条目总数
  entries: PoiCacheExportEntry[]
}

// 导出条目（包含key）
export interface PoiCacheExportEntry extends PoiCacheEntry {
  key: string            // 缓存key（不含gzf-前缀）
}

// 导入结果
export interface ImportResult {
  imported: number       // 成功导入数量
  skipped: number        // 跳过数量（已有更新的数据）
  errors: number         // 错误数量
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

  // 内存中的导入缓存（用于三级缓存 Level 2）
  let importedCache: Map<string, PoiCacheEntry> | null = null

  /**
   * 导出所有 POI 缓存
   */
  const exportCache = (): PoiExportData | null => {
    try {
      const entries = storage.getAllWithPrefix<PoiCacheEntry>(CACHE_PREFIX)
      return {
        version: '1.0',
        exportTime: Date.now(),
        totalCount: entries.length,
        entries: entries.map(e => ({ ...e.value, key: e.key }))
      }
    } catch (e) {
      console.error('Failed to export POI cache:', e)
      return null
    }
  }

  /**
   * 导入 POI 缓存数据
   */
  const importCache = (data: PoiExportData): ImportResult => {
    const result: ImportResult = { imported: 0, skipped: 0, errors: 0 }

    // 验证版本
    if (data.version !== '1.0') {
      console.error('Unsupported cache version:', data.version)
      result.errors = data.entries?.length || 0
      return result
    }

    // 初始化导入缓存
    if (!importedCache) {
      importedCache = new Map()
    }

    for (const entry of data.entries) {
      try {
        // 检查是否已过期
        if (isExpired(entry.timestamp)) {
          result.skipped++
          continue
        }

        // 检查 localStorage 是否已有更新的数据
        const existing = storage.get<PoiCacheEntry>(entry.key)
        if (existing && existing.timestamp >= entry.timestamp) {
          // 本地数据更新，跳过
          result.skipped++
          // 但仍加入内存缓存作为备份
          importedCache.set(entry.key, entry)
          continue
        }

        // 保存到 localStorage
        const { key, ...cacheEntry } = entry
        storage.set(key, cacheEntry)

        // 同时保存到内存缓存
        importedCache.set(key, entry)

        result.imported++
      } catch (e) {
        console.error('Failed to import cache entry:', e)
        result.errors++
      }
    }

    return result
  }

  /**
   * 获取缓存（支持三级缓存：localStorage -> importedCache -> null）
   */
  const getCachedWithImport = (
    latitude: number | string,
    longitude: number | string,
    category: string,
    radius: number
  ): PoiCacheEntry | null => {
    const key = generateKey(latitude, longitude, category, radius)

    // Level 1: localStorage
    const cached = getCached(latitude, longitude, category, radius)
    if (cached) {
      return cached
    }

    // Level 2: importedCache（内存中的导入数据）
    if (importedCache) {
      const imported = importedCache.get(key)
      if (imported && !isExpired(imported.timestamp)) {
        // 提升到 localStorage
        const { key: _, ...cacheEntry } = imported
        storage.set(key, cacheEntry)
        return imported
      }
    }

    // Level 3: 返回 null（由调用方处理 API 请求）
    return null
  }

  return {
    getCached,
    setCached,
    clearCache,
    isExpired,
    exportCache,
    importCache,
    getCachedWithImport
  }
}
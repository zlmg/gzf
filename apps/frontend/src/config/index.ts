/**
 * 全局配置
 */

/** 图片基础 URL */
export const IMAGE_BASE_URL = 'https://www.bsgzf.com.cn'

/** 图片路径处理 */
export function getImageUrl(path: string | undefined | null): string {
  if (!path)
    return ''
  return `${IMAGE_BASE_URL}${path}`
}

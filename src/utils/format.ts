export const formatPrice = (price: number): string => {
  if (!price && price !== 0) return '-'
  return `¥${price.toLocaleString()}`
}

export const formatPriceRange = (min: number, max: number): string => {
  if (!min && !max) return '面议'
  if (min === max || !max) return formatPrice(min)
  return `${formatPrice(min)} - ${formatPrice(max)}`
}

export const formatRoomType = (type: string): string => {
  if (!type) return '-'
  const typeMap: Record<string, string> = {
    '一': '一房',
    '二': '二房',
    '三': '三房',
    '四': '四房'
  }
  return typeMap[type] || type
}

export const formatOpenQueue = (status: string): string => {
  if (!status) return '-'
  return status === '是' || status === '1' ? '开放' : '未开放'
}

export const truncateText = (text: string, maxLength: number): string => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
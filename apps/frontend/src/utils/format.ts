export function formatPrice(price: number): string {
  if (!price && price !== 0)
    return '-'
  return `¥${price.toLocaleString()}`
}

export function formatPriceRange(min: number, max: number): string {
  if (!min && !max)
    return '面议'
  if (min === max || !max)
    return formatPrice(min)
  return `${formatPrice(min)} - ${formatPrice(max)}`
}

export function formatRoomType(type: string): string {
  if (!type)
    return '-'
  const typeMap: Record<string, string> = {
    一: '一房',
    二: '二房',
    三: '三房',
    四: '四房',
  }
  return typeMap[type] || type
}

export function formatOpenQueue(status: string): string {
  if (!status)
    return '-'
  return status === '是' || status === '1' ? '开放' : '未开放'
}

export function truncateText(text: string, maxLength: number): string {
  if (!text)
    return ''
  if (text.length <= maxLength)
    return text
  return `${text.slice(0, maxLength)}...`
}

// 户型代码格式化：101 → 一室一卫, 211 → 二室一厅一卫
export function formatRoomTypeCode(code: string): string {
  if (!code)
    return '-'
  // 代码格式: 第一位=室，第二位=厅，第三位=卫
  const digits = code.split('')
  if (digits.length !== 3)
    return code

  const numberMap: Record<string, string> = {
    0: '',
    1: '一',
    2: '二',
    3: '三',
    4: '四',
    5: '五',
  }

  const room = numberMap[digits[0]!] || ''
  const hall = numberMap[digits[1]!] || ''
  const bath = numberMap[digits[2]!] || ''

  let result = ''
  if (room)
    result += `${room}室`
  if (hall)
    result += `${hall}厅`
  if (bath)
    result += `${bath}卫`

  return result || code
}

// 设备列表格式化（逗号分隔 → 标签数组）
export function formatEquipmentList(equipment: string): string[] {
  if (!equipment)
    return []
  return equipment.split(',').map(item => item.trim()).filter(Boolean)
}

// 标签列表格式化
export function formatLabelList(label: string): string[] {
  if (!label)
    return []
  return label.split(',').map(item => item.trim()).filter(Boolean)
}

// 面积格式化
export function formatArea(area: string | number): string {
  if (!area)
    return '-'
  return `${area}m²`
}

// 房型名称简化：一居室A户型 → 一居室，二居室 → 二居室
export function formatHouseTypeName(name: string): string {
  if (!name)
    return '-'
  const firstChar = name.charAt(0)
  const roomMap: Record<string, string> = {
    一: '一居室',
    二: '二居室',
    三: '三居室',
    四: '四居室',
  }
  return roomMap[firstChar] || name.slice(0, 3)
}

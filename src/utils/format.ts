/**
 * 格式化字节为可读的大小
 * @param bytes 字节数
 * @param decimals 小数位数，默认 2
 * @returns 格式化后的字符串，如 "1.23 GB"
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * 格式化日期时间
 * @param date 日期字符串或 Date 对象
 * @param format 格式，默认 'YYYY-MM-DD HH:mm:ss'
 * @returns 格式化后的日期字符串
 */
export function formatDateTime(
  date: string | Date,
  format: string = 'YYYY-MM-DD HH:mm:ss'
): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '-'

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  const second = String(d.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('mm', minute)
    .replace('ss', second)
}

/**
 * 格式化百分比
 * @param value 数值（0-100）
 * @param decimals 小数位数，默认 1
 * @returns 格式化后的百分比字符串，如 "12.3%"
 */
export function formatPercent(value: number, decimals: number = 1): string {
  if (isNaN(value)) return '0%'
  return value.toFixed(decimals) + '%'
}

/**
 * 格式化数字为千分位格式
 * @param num 数字
 * @returns 格式化后的字符串，如 "1,234,567"
 */
export function formatNumber(num: number): string {
  if (isNaN(num)) return '0'
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * 格式化持续时间（毫秒）
 * @param ms 毫秒数
 * @returns 格式化后的字符串，如 "1d 2h 3m 4s"
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`

  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  const parts: string[] = []
  if (days > 0) parts.push(`${days}天`)
  if (hours % 24 > 0) parts.push(`${hours % 24}时`)
  if (minutes % 60 > 0) parts.push(`${minutes % 60}分`)
  if (seconds % 60 > 0) parts.push(`${seconds % 60}秒`)

  return parts.join(' ') || '0秒'
}

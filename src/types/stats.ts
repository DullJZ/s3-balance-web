/**
 * 月度统计响应
 */
export interface MonthlyStatsResponse {
  year: number // 年份
  month: number // 月份
  bucket: string // 桶名称
  stats: BucketOperationCounts // 统计数据
}

/**
 * 存储桶操作计数
 */
export interface BucketOperationCounts {
  operation_count_a: number // 操作 A 计数
  operation_count_b: number // 操作 B 计数
  total: number // 总计
}

/**
 * 统计查询参数
 */
export interface StatsQueryParams {
  start_year?: number
  start_month?: number
  end_year?: number
  end_month?: number
  bucket?: string
  months?: number
}

/**
 * 时间序列数据点
 */
export interface TimeSeriesDataPoint {
  timestamp: string // 时间戳
  value: number // 值
}

/**
 * 存储桶历史统计
 */
export interface BucketHistoryStats {
  bucket: string
  data: MonthlyStatsResponse[]
}

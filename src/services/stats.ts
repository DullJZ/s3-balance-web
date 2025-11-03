import { request } from './api'
import type { MonthlyStatsResponse, StatsQueryParams } from '@/types/stats'

/**
 * 统计相关 API
 */
export const statsApi = {
  /**
   * 获取当前月份统计
   */
  getCurrentMonthStats(): Promise<MonthlyStatsResponse[]> {
    return request.get('/api/stats/monthly')
  },

  /**
   * 获取指定月份统计
   */
  getMonthlyStats(year: number, month: number): Promise<MonthlyStatsResponse[]> {
    return request.get(`/api/stats/monthly/${year}/${month}`)
  },

  /**
   * 获取时间范围内的统计
   */
  getMonthlyStatsRange(params: StatsQueryParams): Promise<MonthlyStatsResponse[]> {
    return request.get('/api/stats/monthly/range', { params })
  },

  /**
   * 获取指定存储桶的历史统计
   */
  getBucketHistory(bucket: string, months: number = 12): Promise<MonthlyStatsResponse[]> {
    return request.get(`/api/stats/bucket/${bucket}/history`, {
      params: { months },
    })
  },

  /**
   * 手动触发归档当前月份
   */
  archiveCurrentMonth(): Promise<{ status: string; message: string }> {
    return request.post('/api/stats/archive')
  },
}

export default statsApi

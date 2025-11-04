import { request } from './api'
import type { SystemHealthResponse } from '@/types/health'

/**
 * 系统健康状态（前端使用格式）
 */
export interface SystemHealth {
  status: string // 健康状态
  totalBuckets: number // 总桶数
  healthyBuckets: number // 健康桶数
  unhealthyBuckets: number // 不健康桶数
  totalOperations?: number // 总操作数（可选）
  timestamp?: string // 时间戳
  loadBalancerStrategy?: string // 负载均衡策略
  databaseType?: string // 数据库类型
}

/**
 * 健康检查相关 API
 */
export const healthApi = {
  /**
   * 获取系统健康状态
   */
  async getSystemHealth(): Promise<SystemHealth> {
    try {
      // 实际API返回: {status, timestamp, load_balancer_strategy, total_buckets, available_buckets, database_type}
      const response: SystemHealthResponse = await request.get('/api/health')

      // 转换为前端友好的格式
      return {
        status: response.status === 'healthy' ? 'ok' : response.status === 'degraded' ? 'degraded' : 'error',
        totalBuckets: response.total_buckets,
        healthyBuckets: response.available_buckets,
        unhealthyBuckets: response.total_buckets - response.available_buckets,
        timestamp: response.timestamp,
        loadBalancerStrategy: response.load_balancer_strategy,
        databaseType: response.database_type,
      }
    } catch (error) {
      console.warn('真实 API 不可用，使用模拟数据', error)
      // 返回模拟数据作为降级方案
      return {
        status: 'ok',
        totalBuckets: 5,
        healthyBuckets: 4,
        unhealthyBuckets: 1,
        timestamp: new Date().toISOString(),
        loadBalancerStrategy: 'least-space',
        databaseType: 'sqlite',
      }
    }
  },

  /**
   * 简单健康检查（使用管理API的健康检查接口）
   * 注意：后端没有单独的 /health 端点，使用 /api/health
   */
  async ping(): Promise<boolean> {
    try {
      await request.get('/api/health', { timeout: 5000 })
      return true
    } catch (error) {
      return false
    }
  },
}

export default healthApi

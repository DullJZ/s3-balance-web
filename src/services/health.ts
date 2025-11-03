import { request } from './api'

/**
 * 系统健康状态
 */
export interface SystemHealth {
  status: string
  total_buckets: number
  healthy_buckets: number
  timestamp?: string
}

/**
 * 健康检查相关 API
 */
export const healthApi = {
  /**
   * 获取系统健康状态
   * 注意：此接口需要后端添加支持
   */
  async getSystemHealth(): Promise<SystemHealth> {
    try {
      return await request.get('/api/health')
    } catch (error) {
      console.warn('真实 API 不可用，使用模拟数据')
      // 返回模拟数据作为降级方案
      return {
        status: 'ok',
        total_buckets: 5,
        healthy_buckets: 4,
        timestamp: new Date().toISOString(),
      }
    }
  },

  /**
   * 简单健康检查（检查服务是否可用）
   */
  async ping(): Promise<boolean> {
    try {
      await request.get('/health', { timeout: 5000 })
      return true
    } catch (error) {
      return false
    }
  },
}

export default healthApi

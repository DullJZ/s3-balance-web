import { request } from './api'
import type { BucketConfig, BucketDetail, BucketHealth, BucketListResponse } from '@/types/bucket'

/**
 * 存储桶相关 API
 */
export const bucketApi = {
  /**
   * 获取所有桶列表
   */
  async getBuckets(): Promise<BucketConfig[]> {
    try {
      // 实际API返回格式: {total: number, buckets: BucketConfig[]}
      const response: BucketListResponse = await request.get('/api/buckets')
      return response.buckets
    } catch (error) {
      console.warn('真实 API 不可用，使用模拟数据', error)
      // 返回模拟数据作为降级方案
      return getMockBuckets()
    }
  },

  /**
   * 获取桶详情
   */
  async getBucketDetail(name: string): Promise<BucketDetail> {
    try {
      // 实际API直接返回BucketConfig，包含所有字段
      return await request.get(`/api/buckets/${name}`)
    } catch (error) {
      console.warn('真实 API 不可用，使用模拟数据', error)
      return getMockBucketDetail(name)
    }
  },

  /**
   * 获取桶健康状态（可选接口，数据已包含在详情中）
   */
  async getBucketHealth(name: string): Promise<BucketHealth> {
    try {
      const detail = await this.getBucketDetail(name)
      // 从BucketConfig转换为BucketHealth格式
      return {
        name: detail.name,
        healthy: detail.available,
        last_check: detail.last_checked,
        response_time: 0, // API未提供单独的响应时间
        error_message: detail.available ? undefined : '存储桶不可用',
      }
    } catch (error) {
      console.warn('真实 API 不可用，使用模拟数据', error)
      return getMockBucketHealth(name)
    }
  },
}

// ========== 模拟数据（降级方案）==========

function getMockBuckets(): BucketConfig[] {
  return [
    {
      name: 'user-bucket-1',
      endpoint: '',
      region: 'us-east-1',
      max_size: '100GB',
      max_size_bytes: 107374182400,
      used_size: 0,
      available_size: 107374182400,
      usage_percent: 0.0,
      weight: 10,
      enabled: true,
      available: true,
      virtual: true,
      last_checked: new Date().toISOString(),
      operation_count_a: 0,
      operation_count_b: 0,
      operation_limits: { type_a: 0, type_b: 0 },
    },
    {
      name: 'user-bucket-2',
      endpoint: '',
      region: 'us-east-1',
      max_size: '50GB',
      max_size_bytes: 53687091200,
      used_size: 0,
      available_size: 53687091200,
      usage_percent: 0.0,
      weight: 10,
      enabled: true,
      available: true,
      virtual: true,
      last_checked: new Date().toISOString(),
      operation_count_a: 0,
      operation_count_b: 0,
      operation_limits: { type_a: 0, type_b: 0 },
    },
    {
      name: 'my-bucket-1',
      endpoint: 'https://s3.amazonaws.com',
      region: 'us-east-1',
      max_size: '100GB',
      max_size_bytes: 107374182400,
      used_size: 69793218560,
      available_size: 37580963840,
      usage_percent: 65.0,
      weight: 10,
      enabled: true,
      available: true,
      virtual: false,
      last_checked: new Date().toISOString(),
      operation_count_a: 150,
      operation_count_b: 320,
      operation_limits: { type_a: 0, type_b: 0 },
      access_key_id: 'AKIAIOSFODNN7EXAMPLE',
      secret_access_key: '***',
    },
    {
      name: 'my-bucket-2',
      endpoint: 'http://localhost:9000',
      region: 'us-east-1',
      max_size: '50GB',
      max_size_bytes: 53687091200,
      used_size: 32212254720,
      available_size: 21474836480,
      usage_percent: 60.0,
      weight: 5,
      enabled: true,
      available: true,
      virtual: false,
      last_checked: new Date().toISOString(),
      operation_count_a: 89,
      operation_count_b: 230,
      operation_limits: { type_a: 0, type_b: 0 },
      access_key_id: 'minioadmin',
      secret_access_key: '***',
    },
    {
      name: 'my-bucket-3',
      endpoint: 'https://oss-cn-hangzhou.aliyuncs.com',
      region: 'cn-hangzhou',
      max_size: '200GB',
      max_size_bytes: 214748364800,
      used_size: 0,
      available_size: 214748364800,
      usage_percent: 0.0,
      weight: 15,
      enabled: false,
      available: false,
      virtual: false,
      last_checked: new Date().toISOString(),
      operation_count_a: 0,
      operation_count_b: 0,
      operation_limits: { type_a: 0, type_b: 0 },
      access_key_id: 'LTAIxxxx',
      secret_access_key: '***',
    },
  ]
}

function getMockBucketDetail(name: string): BucketDetail {
  const buckets = getMockBuckets()
  const bucket = buckets.find((b) => b.name === name)

  if (bucket) {
    return bucket
  }

  // 如果找不到，返回第一个
  return buckets[0]
}

function getMockBucketHealth(name: string): BucketHealth {
  return {
    name: name,
    healthy: Math.random() > 0.1, // 90% 健康
    last_check: new Date().toISOString(),
    response_time: Math.floor(Math.random() * 100 + 20),
    error_message: Math.random() > 0.9 ? 'Connection timeout' : undefined,
  }
}

export default bucketApi

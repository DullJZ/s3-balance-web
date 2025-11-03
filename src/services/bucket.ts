import { request } from './api'
import type { BucketConfig, BucketDetail, BucketHealth } from '@/types/bucket'

/**
 * 存储桶相关 API
 */
export const bucketApi = {
  /**
   * 获取所有桶列表
   * 注意：此接口需要后端添加支持
   */
  async getBuckets(): Promise<BucketConfig[]> {
    try {
      return await request.get('/api/buckets')
    } catch (error) {
      console.warn('真实 API 不可用，使用模拟数据')
      // 返回模拟数据作为降级方案
      return getMockBuckets()
    }
  },

  /**
   * 获取桶详情
   * 注意：此接口需要后端添加支持
   */
  async getBucketDetail(name: string): Promise<BucketDetail> {
    try {
      return await request.get(`/api/buckets/${name}`)
    } catch (error) {
      console.warn('真实 API 不可用，使用模拟数据')
      return getMockBucketDetail(name)
    }
  },

  /**
   * 获取桶健康状态
   * 注意：此接口需要后端添加支持
   */
  async getBucketHealth(name: string): Promise<BucketHealth> {
    try {
      return await request.get(`/api/buckets/${name}/health`)
    } catch (error) {
      console.warn('真实 API 不可用，使用模拟数据')
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
      access_key_id: '',
      secret_access_key: '',
      max_size: '100GB',
      max_size_bytes: 107374182400,
      weight: 10,
      enabled: true,
      path_style: false,
      virtual: true,
      operation_limits: { type_a: 0, type_b: 0 },
    },
    {
      name: 'user-bucket-2',
      endpoint: '',
      region: 'us-east-1',
      access_key_id: '',
      secret_access_key: '',
      max_size: '50GB',
      max_size_bytes: 53687091200,
      weight: 10,
      enabled: true,
      path_style: false,
      virtual: true,
      operation_limits: { type_a: 0, type_b: 0 },
    },
    {
      name: 'my-bucket-1',
      endpoint: 'https://s3.amazonaws.com',
      region: 'us-east-1',
      access_key_id: 'AKIAIOSFODNN7EXAMPLE',
      secret_access_key: '***',
      max_size: '100GB',
      max_size_bytes: 107374182400,
      weight: 10,
      enabled: true,
      path_style: false,
      virtual: false,
      operation_limits: { type_a: 0, type_b: 0 },
    },
    {
      name: 'my-bucket-2',
      endpoint: 'http://localhost:9000',
      region: 'us-east-1',
      access_key_id: 'minioadmin',
      secret_access_key: '***',
      max_size: '50GB',
      max_size_bytes: 53687091200,
      weight: 5,
      enabled: true,
      path_style: true,
      virtual: false,
      operation_limits: { type_a: 0, type_b: 0 },
    },
    {
      name: 'my-bucket-3',
      endpoint: 'https://oss-cn-hangzhou.aliyuncs.com',
      region: 'cn-hangzhou',
      access_key_id: 'LTAIxxxx',
      secret_access_key: '***',
      max_size: '200GB',
      max_size_bytes: 214748364800,
      weight: 15,
      enabled: false,
      path_style: false,
      virtual: false,
      operation_limits: { type_a: 0, type_b: 0 },
    },
  ]
}

function getMockBucketDetail(name: string): BucketDetail {
  const buckets = getMockBuckets()
  const bucket = buckets.find((b) => b.name === name) || buckets[0]

  return {
    ...bucket,
    health: getMockBucketHealth(name),
    stats: {
      name: name,
      object_count: Math.floor(Math.random() * 10000),
      total_size: bucket.max_size_bytes,
      used_size: Math.floor(bucket.max_size_bytes * (Math.random() * 0.8)),
      available_size: Math.floor(bucket.max_size_bytes * (Math.random() * 0.2 + 0.2)),
      usage_percent: Math.random() * 80,
    },
  }
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

/**
 * 系统健康状态响应
 */
export interface SystemHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy' // 健康状态
  timestamp: string // 当前时间戳（ISO 8601 格式）
  load_balancer_strategy: string // 当前负载均衡策略
  total_buckets: number // 配置的存储桶总数
  available_buckets: number // 可用的存储桶数量
  database_type: string // 数据库类型
}

/**
 * 系统健康状态（前端友好格式）
 */
export interface SystemHealth {
  status: 'ok' | 'degraded' | 'error' // 健康状态（归一化）
  totalBuckets: number // 总桶数
  healthyBuckets: number // 健康桶数
  unhealthyBuckets: number // 不健康桶数
  totalOperations: number // 总操作数
  timestamp: string // 时间戳
  uptimeSeconds?: number // 运行时间（秒）
  version?: string // 版本号
  loadBalancerStrategy?: string // 负载均衡策略
  databaseType?: string // 数据库类型
}

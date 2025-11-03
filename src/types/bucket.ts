/**
 * 存储桶配置
 */
export interface BucketConfig {
  name: string // 桶名称
  endpoint: string // S3 端点
  region: string // 区域
  access_key_id: string // 访问密钥 ID
  secret_access_key: string // 访问密钥
  max_size: string // 最大容量（如 "100GB"）
  max_size_bytes: number // 最大容量（字节）
  weight: number // 权重
  enabled: boolean // 是否启用
  path_style: boolean // 是否使用路径风格
  virtual: boolean // 是否为虚拟桶
  operation_limits: OperationLimits // 操���限制
}

/**
 * 操作限制
 */
export interface OperationLimits {
  type_a: number // 类型 A 操作上限
  type_b: number // 类型 B 操作上限
}

/**
 * 存储桶健康状态
 */
export interface BucketHealth {
  name: string // 桶名称
  healthy: boolean // 是否健康
  last_check: string // 最后检查时间
  response_time: number // 响应时间（毫秒）
  error_message?: string // 错误信息
}

/**
 * 存储桶统计信息
 */
export interface BucketStats {
  name: string // 桶名称
  object_count: number // 对象数量
  total_size: number // 总大小（字节）
  used_size: number // 已用大小（字节）
  available_size: number // 可用大小（字节）
  usage_percent: number // 使用率（百分比）
}

/**
 * 存储桶详细信息
 */
export interface BucketDetail extends BucketConfig {
  health: BucketHealth
  stats: BucketStats
}

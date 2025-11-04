/**
 * 操作限制
 */
export interface OperationLimits {
  type_a: number // 类型 A 操作上限
  type_b: number // 类型 B 操作上限
}

/**
 * 存储桶配置（实际API返回格式）
 */
export interface BucketConfig {
  name: string // 桶名称
  endpoint: string // S3 端点
  region: string // 区域
  max_size: string // 最大容量（如 "5GB"）
  max_size_bytes: number // 最大容量（字节）
  used_size: number // 已使用容量（字节）
  available_size: number // 可用容量（字节），-1 表示无限制
  usage_percent: number // 使用百分比
  weight: number // 负载均衡权重
  enabled: boolean // 是否启用
  available: boolean // 是否可用（健康检查结果）
  virtual: boolean // 是否为虚拟桶
  last_checked: string // 最后健康检查时间（ISO 8601 格式）
  operation_count_a: number // A类操作计数（写入类）
  operation_count_b: number // B类操作计数（读取类）
  operation_limits: OperationLimits // 操作限制
  // 以下字段仅在配置中使用，API响应中可能为空或脱敏
  access_key_id?: string // 访问密钥 ID
  secret_access_key?: string // 访问密钥（已脱敏）
  path_style?: boolean // 是否使用路径风格
}

/**
 * 存储桶列表响应
 */
export interface BucketListResponse {
  total: number // 存储桶总数
  buckets: BucketConfig[] // 存储桶列表
}

/**
 * 存储桶详细信息（与BucketConfig相同，实际API返回格式一致）
 */
export type BucketDetail = BucketConfig

/**
 * 存储桶健康状态（向后兼容，用于前端内部使用）
 */
export interface BucketHealth {
  name: string // 桶名称
  healthy: boolean // 是否健康
  last_check: string // 最后检查时间
  response_time: number // 响应时间（毫秒）
  error_message?: string // 错误信息
}

/**
 * 存储桶统计信息（向后兼容，用于前端内部使用）
 */
export interface BucketStats {
  name: string // 桶名称
  object_count: number // 对象数量
  total_size: number // 总大小（字节）
  used_size: number // 已用大小（字节）
  available_size: number // 可用大小（字节）
  usage_percent: number // 使用率（百分比）
}

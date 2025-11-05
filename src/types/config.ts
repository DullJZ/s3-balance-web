/**
 * 服务器配置
 */
export interface ServerConfig {
  host: string // 监听地址
  port: number // 监听端口
  read_timeout: string // 读取超时
  write_timeout: string // 写入超时
  idle_timeout: string // 空闲超时
}

/**
 * 数据库配置
 */
export interface DatabaseConfig {
  type: string // 数据库类型
  dsn: string // 数据源名称
  max_open_conns: number // 最大打开连接数
  max_idle_conns: number // 最大空闲连接数
  conn_max_lifetime: number // 连接最大生命周期
  log_level: string // 日志级别
  auto_migrate: boolean // 是否自动迁移
}

/**
 * 负载均衡配置
 */
export interface BalancerConfig {
  strategy: 'round-robin' | 'least-space' | 'weighted' | 'consistent-hash' // 负载策略
  health_check_period: string // 健康检查周期
  update_stats_period: string // 统计更新周期
  retry_attempts: number // 重试次数
  retry_delay: string // 重试延迟
}

/**
 * 监控指标配置
 */
export interface MetricsConfig {
  enabled: boolean // 是否启用
  path: string // 指标路径
}

/**
 * S3 API 配置
 */
export interface S3APIConfig {
  access_key: string // 访问密钥
  secret_key: string // 秘密密钥
  virtual_host: boolean // 是否使用虚拟主机
  proxy_mode: boolean // 是否使用代理模式
  auth_required: boolean // 是否需要认证
  host: string // 主机地址
}

/**
 * 操作限制配置
 */
export interface OperationLimits {
  type_a: number // A类操作上限（0表示不限制）
  type_b: number // B类操作上限（0表示不限制）
}

/**
 * 存储桶配置
 */
export interface BucketConfigItem {
  name: string // 存储桶名称
  endpoint: string // S3端点URL（虚拟桶为空）
  region: string // 区域
  access_key_id: string // 访问密钥ID
  secret_access_key: string // 秘密访问密钥
  max_size: string // 最大容量（如"10GB"）
  weight: number // 负载均衡权重
  enabled: boolean // 是否启用
  path_style: boolean // 是否使用路径风格
  virtual: boolean // 是否为虚拟存储桶
  operation_limits?: OperationLimits // 操作限制
}

/**
 * 管理API配置
 */
export interface APIConfig {
  enabled: boolean // 是否启用
  token: string // 认证令牌
}

/**
 * 系统配置（完整）
 */
export interface SystemConfig {
  server: ServerConfig
  database: DatabaseConfig
  buckets: BucketConfigItem[]
  balancer: BalancerConfig
  metrics: MetricsConfig
  s3api: S3APIConfig
  api: APIConfig
}

/**
 * 配置更新响应
 */
export interface ConfigUpdateResponse {
  success: boolean
  message: string
  config: SystemConfig
}

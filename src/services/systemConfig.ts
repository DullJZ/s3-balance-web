import api from './api'
import type {
  SystemConfig,
  ConfigUpdateResponse,
  BucketConfigItem,
  OperationLimits,
} from '@/types/config'

/**
 * 系统配置API服务
 * 用于获取和更新后端系统配置
 */

/**
 * 纳秒转换为可读字符串
 * @param nanoseconds 纳秒值
 * @returns 可读字符串（如 "30s", "1m", "1h"）
 */
function nanosecondsToString(nanoseconds: number): string {
  if (nanoseconds === 0) return '0s'

  const seconds = Math.floor(nanoseconds / 1_000_000_000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h`
  } else if (minutes > 0) {
    return `${minutes}m`
  } else {
    return `${seconds}s`
  }
}

/**
 * 可读字符串转换为纳秒
 * @param timeStr 时间字符串（如 "30s", "1m", "1h"）
 * @returns 纳秒值
 */
function stringToNanoseconds(timeStr: string): number {
  const match = timeStr.match(/^(\d+(?:\.\d+)?)(ns|us|µs|ms|s|m|h)$/)
  if (!match) {
    throw new Error(`无效的时间格式: ${timeStr}`)
  }

  const value = parseFloat(match[1])
  const unit = match[2]

  const multipliers: Record<string, number> = {
    'ns': 1,
    'us': 1_000,
    'µs': 1_000,
    'ms': 1_000_000,
    's': 1_000_000_000,
    'm': 60_000_000_000,
    'h': 3_600_000_000_000,
  }

  return Math.floor(value * (multipliers[unit] || 1))
}

/**
 * 工具方法：转换蛇形命名为 PascalCase
 */
function toPascalCase(key: string): string {
  return key
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

/**
 * 工具方法：转换蛇形命名为 camelCase
 */
function toCamelCase(key: string): string {
  const pascal = toPascalCase(key)
  if (!pascal) return pascal
  return pascal.charAt(0).toLowerCase() + pascal.slice(1)
}

/**
 * 从对象中获取字段值，兼容不同命名风格
 */
function normalizeKey(input: string): string {
  return input.replace(/[_\s-]/g, '').toLowerCase()
}

function getField<T = unknown>(obj: any, key: string, fallback?: T): T {
  if (!obj || typeof obj !== 'object') return fallback as T

  const candidates = [key, toCamelCase(key), toPascalCase(key), key.toUpperCase()].filter(Boolean) as string[]
  for (const candidate of candidates) {
    if (Object.prototype.hasOwnProperty.call(obj, candidate)) {
      return obj[candidate]
    }
  }

  const normalizedMap = new Map<string, string>()
  for (const prop of Object.keys(obj)) {
    const normalized = normalizeKey(prop)
    if (!normalizedMap.has(normalized)) {
      normalizedMap.set(normalized, prop)
    }
  }

  for (const candidate of candidates) {
    const normalizedCandidate = normalizeKey(candidate)
    const matchKey = normalizedMap.get(normalizedCandidate)
    if (matchKey !== undefined) {
      return obj[matchKey]
    }
  }

  return fallback as T
}

/**
 * 获取配置模块（Server/Database 等），兼容不同命名风格
 */
function getSection(config: any, key: string): any {
  return getField(config, key, {})
}

function toNumber(value: unknown, fallback = 0): number {
  if (value === undefined || value === null) return fallback
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

function toBoolean(value: unknown, fallback = false): boolean {
  if (value === undefined || value === null) return fallback
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true') return true
    if (normalized === 'false') return false
  }
  return fallback
}

function normalizeOperationLimits(limits: any): OperationLimits | undefined {
  if (!limits || typeof limits !== 'object') return undefined

  return {
    type_a: toNumber(getField(limits, 'type_a', 0)),
    type_b: toNumber(getField(limits, 'type_b', 0)),
  }
}

function normalizeBucket(bucket: any): BucketConfigItem {
  return {
    name: getField(bucket, 'name', ''),
    endpoint: getField(bucket, 'endpoint', ''),
    region: getField(bucket, 'region', ''),
    access_key_id: getField(bucket, 'access_key_id', ''),
    secret_access_key: getField(bucket, 'secret_access_key', ''),
    max_size: getField(bucket, 'max_size', ''),
    weight: toNumber(getField(bucket, 'weight', 0)),
    enabled: toBoolean(getField(bucket, 'enabled', true), true),
    path_style: toBoolean(getField(bucket, 'path_style', false)),
    virtual: toBoolean(getField(bucket, 'virtual', false)),
    operation_limits: normalizeOperationLimits(getField(bucket, 'operation_limits')),
  }
}

/**
 * 转换后端配置为前端可读格式
 * @param config 后端配置
 * @returns 前端格式配置
 */
function transformConfigFromBackend(config: any): SystemConfig {
  const server = getSection(config, 'server')
  const database = getSection(config, 'database')
  const balancer = getSection(config, 'balancer')
  const metrics = getSection(config, 'metrics')
  const s3api = getSection(config, 's3api')
  const apiSection = getSection(config, 'api')
  const buckets = Array.isArray(getField(config, 'buckets')) ? getField(config, 'buckets') : getField(config, 'Buckets', [])

  return {
    server: {
      host: getField(server, 'host', ''),
      port: toNumber(getField(server, 'port', 0)),
      read_timeout: nanosecondsToString(toNumber(getField(server, 'read_timeout', 0))),
      write_timeout: nanosecondsToString(toNumber(getField(server, 'write_timeout', 0))),
      idle_timeout: nanosecondsToString(toNumber(getField(server, 'idle_timeout', 0))),
    },
    database: {
      type: getField(database, 'type', ''),
      dsn: getField(database, 'dsn', ''),
      max_open_conns: toNumber(getField(database, 'max_open_conns', 0)),
      max_idle_conns: toNumber(getField(database, 'max_idle_conns', 0)),
      conn_max_lifetime: toNumber(getField(database, 'conn_max_lifetime', 0)),
      log_level: getField(database, 'log_level', ''),
      auto_migrate: toBoolean(getField(database, 'auto_migrate', false)),
    },
    buckets: Array.isArray(buckets) ? buckets.map(normalizeBucket) : [],
    balancer: {
      strategy: getField(balancer, 'strategy', 'least-space'),
      health_check_period: nanosecondsToString(toNumber(getField(balancer, 'health_check_period', 0))),
      update_stats_period: nanosecondsToString(toNumber(getField(balancer, 'update_stats_period', 0))),
      retry_attempts: toNumber(getField(balancer, 'retry_attempts', 0)),
      retry_delay: nanosecondsToString(toNumber(getField(balancer, 'retry_delay', 0))),
    },
    metrics: {
      enabled: toBoolean(getField(metrics, 'enabled', true), true),
      path: getField(metrics, 'path', '/metrics'),
    },
    s3api: {
      access_key: getField(s3api, 'access_key', ''),
      secret_key: getField(s3api, 'secret_key', ''),
      virtual_host: toBoolean(getField(s3api, 'virtual_host', false)),
      proxy_mode: toBoolean(getField(s3api, 'proxy_mode', false)),
      auth_required: toBoolean(getField(s3api, 'auth_required', false)),
      host: getField(s3api, 'host', ''),
    },
    api: {
      enabled: toBoolean(getField(apiSection, 'enabled', true), true),
      token: getField(apiSection, 'token', ''),
    },
  }
}

/**
 * 转换前端配置为后端格式
 * @param config 前端配置
 * @returns 后端格式配置
 */
function transformConfigToBackend(config: SystemConfig): any {
  return {
    Server: {
      Host: config.server.host,
      Port: config.server.port,
      ReadTimeout: stringToNanoseconds(config.server.read_timeout),
      WriteTimeout: stringToNanoseconds(config.server.write_timeout),
      IdleTimeout: stringToNanoseconds(config.server.idle_timeout),
    },
    Database: {
      Type: config.database.type,
      DSN: config.database.dsn,
      MaxOpenConns: config.database.max_open_conns,
      MaxIdleConns: config.database.max_idle_conns,
      ConnMaxLifetime: config.database.conn_max_lifetime,
      LogLevel: config.database.log_level,
      AutoMigrate: config.database.auto_migrate,
    },
    Buckets: config.buckets.map((bucket) => {
      const result: Record<string, unknown> = {
        Name: bucket.name,
        Endpoint: bucket.endpoint,
        Region: bucket.region,
        AccessKeyID: bucket.access_key_id,
        SecretAccessKey: bucket.secret_access_key,
        MaxSize: bucket.max_size,
        Weight: bucket.weight,
        Enabled: bucket.enabled,
        PathStyle: bucket.path_style,
        Virtual: bucket.virtual,
      }

      if (bucket.operation_limits) {
        result.OperationLimits = {
          TypeA: bucket.operation_limits.type_a,
          TypeB: bucket.operation_limits.type_b,
        }
      }

      return result
    }),
    Balancer: {
      Strategy: config.balancer.strategy,
      HealthCheckPeriod: stringToNanoseconds(config.balancer.health_check_period),
      UpdateStatsPeriod: stringToNanoseconds(config.balancer.update_stats_period),
      RetryAttempts: config.balancer.retry_attempts,
      RetryDelay: stringToNanoseconds(config.balancer.retry_delay),
    },
    Metrics: {
      Enabled: config.metrics.enabled,
      Path: config.metrics.path,
    },
    S3API: {
      AccessKey: config.s3api.access_key,
      SecretKey: config.s3api.secret_key,
      VirtualHost: config.s3api.virtual_host,
      ProxyMode: config.s3api.proxy_mode,
      AuthRequired: config.s3api.auth_required,
      Host: config.s3api.host,
    },
    API: {
      Enabled: config.api.enabled,
      Token: config.api.token,
    },
  }
}

/**
 * 系统配置API
 */
export const systemConfigApi = {
  /**
   * 获取系统配置
   */
  async getConfig(): Promise<SystemConfig> {
    const response = await api.get('/api/config')
    return transformConfigFromBackend(response.data)
  },

  /**
   * 更新系统配置
   * @param config 新配置
   * @returns 更新响应
   */
  async updateConfig(config: SystemConfig): Promise<ConfigUpdateResponse> {
    const backendConfig = transformConfigToBackend(config)
    const response = await api.post('/api/config', backendConfig)

    return {
      success: response.data.success,
      message: response.data.message,
      config: transformConfigFromBackend(response.data.config),
    }
  },
}

export default systemConfigApi

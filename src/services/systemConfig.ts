import api from './api'
import type { SystemConfig, ConfigUpdateResponse } from '@/types/config'

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
 * 转换后端配置为前端可读格式
 * @param config 后端配置
 * @returns 前端格式配置
 */
function transformConfigFromBackend(config: any): SystemConfig {
  return {
    server: {
      host: config.server.host,
      port: config.server.port,
      read_timeout: nanosecondsToString(config.server.read_timeout),
      write_timeout: nanosecondsToString(config.server.write_timeout),
      idle_timeout: nanosecondsToString(config.server.idle_timeout),
    },
    database: {
      type: config.database.type,
      dsn: config.database.dsn,
      max_open_conns: config.database.max_open_conns,
      max_idle_conns: config.database.max_idle_conns,
      conn_max_lifetime: config.database.conn_max_lifetime,
      log_level: config.database.log_level,
      auto_migrate: config.database.auto_migrate,
    },
    buckets: config.buckets || [],
    balancer: {
      strategy: config.balancer.strategy,
      health_check_period: nanosecondsToString(config.balancer.health_check_period),
      update_stats_period: nanosecondsToString(config.balancer.update_stats_period),
      retry_attempts: config.balancer.retry_attempts,
      retry_delay: nanosecondsToString(config.balancer.retry_delay),
    },
    metrics: {
      enabled: config.metrics.enabled,
      path: config.metrics.path,
    },
    s3api: {
      access_key: config.s3api.access_key,
      secret_key: config.s3api.secret_key,
      virtual_host: config.s3api.virtual_host,
      proxy_mode: config.s3api.proxy_mode,
      auth_required: config.s3api.auth_required,
      host: config.s3api.host,
    },
    api: {
      enabled: config.api.enabled,
      token: config.api.token,
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
    server: {
      host: config.server.host,
      port: config.server.port,
      read_timeout: stringToNanoseconds(config.server.read_timeout),
      write_timeout: stringToNanoseconds(config.server.write_timeout),
      idle_timeout: stringToNanoseconds(config.server.idle_timeout),
    },
    database: {
      type: config.database.type,
      dsn: config.database.dsn,
      max_open_conns: config.database.max_open_conns,
      max_idle_conns: config.database.max_idle_conns,
      conn_max_lifetime: config.database.conn_max_lifetime,
      log_level: config.database.log_level,
      auto_migrate: config.database.auto_migrate,
    },
    buckets: config.buckets,
    balancer: {
      strategy: config.balancer.strategy,
      health_check_period: stringToNanoseconds(config.balancer.health_check_period),
      update_stats_period: stringToNanoseconds(config.balancer.update_stats_period),
      retry_attempts: config.balancer.retry_attempts,
      retry_delay: stringToNanoseconds(config.balancer.retry_delay),
    },
    metrics: {
      enabled: config.metrics.enabled,
      path: config.metrics.path,
    },
    s3api: {
      access_key: config.s3api.access_key,
      secret_key: config.s3api.secret_key,
      virtual_host: config.s3api.virtual_host,
      proxy_mode: config.s3api.proxy_mode,
      auth_required: config.s3api.auth_required,
      host: config.s3api.host,
    },
    api: {
      enabled: config.api.enabled,
      token: config.api.token,
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

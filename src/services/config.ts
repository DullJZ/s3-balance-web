/**
 * 后端配置服务
 * 用于管理后端 API 地址、认证令牌等配置信息
 */

export interface BackendConfig {
  apiBaseUrl: string // 管理API地址（默认8082端口）
  apiToken: string // API认证令牌
  metricsBaseUrl?: string // Prometheus指标地址（可选，默认从apiBaseUrl推断）
  timeout: number // 请求超时时间（毫秒）
}

const CONFIG_STORAGE_KEY = 'backend-config'

/**
 * 获取默认的API基础URL
 * 优先级：环境变量 > 当前访问域名 > localhost:8082
 */
function getDefaultApiBaseUrl(): string {
  // 如果有环境变量配置，使用环境变量
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }

  // 否则使用当前访问域名
  try {
    const protocol = window.location.protocol // http: 或 https:
    const hostname = window.location.hostname // 域名或IP
    const port = window.location.port // 端口号

    // 开发环境：localhost 访问，使用 8082 端口
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:8082`
    }

    // 生产环境：使用当前域名，不包含端口（通过反向代理）
    return `${protocol}//${hostname}`
  } catch (error) {
    // 降级方案
    return 'http://localhost:8082'
  }
}

/**
 * 获取默认配置
 */
function getDefaultConfig(): BackendConfig {
  return {
    apiBaseUrl: getDefaultApiBaseUrl(),
    apiToken: import.meta.env.VITE_API_TOKEN || 'your-secure-api-token-change-this',
    timeout: 10000,
  }
}

/**
 * 配置管理服务
 */
export const configService = {
  /**
   * 获取当前配置
   */
  getConfig(): BackendConfig {
    try {
      const saved = localStorage.getItem(CONFIG_STORAGE_KEY)
      if (saved) {
        return { ...getDefaultConfig(), ...JSON.parse(saved) }
      }
    } catch (error) {
      console.error('读取配置失败:', error)
    }
    return { ...getDefaultConfig() }
  },

  /**
   * 保存配置
   */
  saveConfig(config: Partial<BackendConfig>): void {
    try {
      const current = this.getConfig()
      const updated = { ...current, ...config }
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(updated))

      // 触发配置变更事件
      window.dispatchEvent(new CustomEvent('backend-config-changed', { detail: updated }))
    } catch (error) {
      console.error('保存配置失败:', error)
      throw new Error('保存配置失败')
    }
  },

  /**
   * 重置为默认配置
   */
  resetConfig(): void {
    localStorage.removeItem(CONFIG_STORAGE_KEY)
    window.dispatchEvent(new CustomEvent('backend-config-changed', { detail: getDefaultConfig() }))
  },

  /**
   * 获取 API 基础地址
   */
  getApiBaseUrl(): string {
    return this.getConfig().apiBaseUrl
  },

  /**
   * 获取 API Token
   */
  getApiToken(): string {
    return this.getConfig().apiToken
  },

  /**
   * 获取超时时间
   */
  getTimeout(): number {
    return this.getConfig().timeout
  },

  /**
   * 获取 Prometheus 指标地址
   * 如果未配置，从管理API地址推断（去掉端口号或使用默认端口）
   */
  getMetricsBaseUrl(): string {
    const config = this.getConfig()

    // 如果明确配置了 metricsBaseUrl，直接使用
    if (config.metricsBaseUrl) {
      return config.metricsBaseUrl
    }

    // 从 apiBaseUrl 推断
    // 例如: http://s3.ohmyimage.pp.ua:8082 -> http://s3.ohmyimage.pp.ua
    // 或者: http://localhost:8082 -> http://localhost:8080
    try {
      const url = new URL(config.apiBaseUrl)

      // 如果是 localhost，假设 metrics 在 8080 端口（S3服务）
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        return `${url.protocol}//${url.hostname}:8080`
      }

      // 否则，去掉端口号，使用默认 HTTP/HTTPS 端口
      return `${url.protocol}//${url.hostname}`
    } catch (error) {
      console.error('解析 apiBaseUrl 失败:', error)
      return 'http://localhost:8080'
    }
  },

  /**
   * 测试后端连接
   */
  async testConnection(baseUrl?: string, token?: string): Promise<{ success: boolean; message: string; responseTime?: number }> {
    const url = baseUrl || this.getApiBaseUrl()
    const authToken = token || this.getApiToken()
    const startTime = Date.now()

    try {
      // 尝试访问健康检查端点（使用管理API的健康检查接口）
      const response = await fetch(`${url}/api/health`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5秒超时
      })

      const responseTime = Date.now() - startTime

      if (response.ok) {
        const data = await response.json()
        return {
          success: true,
          message: `连接成功！状态: ${data.status}，响应时间: ${responseTime}ms`,
          responseTime,
        }
      } else if (response.status === 401) {
        return {
          success: false,
          message: 'API Token 无效，请检查认证令牌配置',
        }
      } else {
        return {
          success: false,
          message: `连接失败: HTTP ${response.status} ${response.statusText}`,
        }
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.name === 'TimeoutError'
          ? '连接超时（5秒），请检查后端服务是否启动'
          : `连接失败: ${error.message}`,
      }
    }
  },
}

export default configService

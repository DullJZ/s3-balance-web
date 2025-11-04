/**
 * 后端配置服务
 * 用于管理后端 API 地址、认证令牌等配置信息
 */

export interface BackendConfig {
  apiBaseUrl: string // 管理API地址（默认8082端口）
  apiToken: string // API认证令牌
  timeout: number // 请求超时时间（毫秒）
}

const CONFIG_STORAGE_KEY = 'backend-config'

// 默认配置
const DEFAULT_CONFIG: BackendConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082',
  apiToken: import.meta.env.VITE_API_TOKEN || 'your-secure-api-token-change-this',
  timeout: 10000,
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
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved) }
      }
    } catch (error) {
      console.error('读取配置失败:', error)
    }
    return { ...DEFAULT_CONFIG }
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
    window.dispatchEvent(new CustomEvent('backend-config-changed', { detail: DEFAULT_CONFIG }))
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

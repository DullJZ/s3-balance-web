import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { configService } from './config'

/**
 * 创建 Axios 实例
 */
let instance: AxiosInstance = createAxiosInstance()

/**
 * 创建 Axios 实例（使用当前配置）
 */
function createAxiosInstance(): AxiosInstance {
  const config = configService.getConfig()

  return axios.create({
    baseURL: config.apiBaseUrl,
    timeout: config.timeout,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

/**
 * 监听配置变更，重新创建实例
 */
window.addEventListener('backend-config-changed', () => {
  instance = createAxiosInstance()
  setupInterceptors(instance)
  console.log('后端配置已更新，API 实例已重新创建')
})

/**
 * 设置拦截器
 */
function setupInterceptors(axiosInstance: AxiosInstance): void {
  // 请求拦截器
  axiosInstance.interceptors.request.use(
    (config) => {
      // 添加 Bearer Token 认证
      const token = configService.getApiToken()
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => {
      console.error('请求错误:', error)
      return Promise.reject(error)
    }
  )

  // 响应拦截器
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response
    },
    (error) => {
      // 错误处理
      if (error.response?.status === 401) {
        ElMessage.error('认证失败，请检查 API Token 配置')
      } else {
        const message = error.response?.data?.error || error.response?.data?.message || error.message || '请求失败'
        ElMessage.error(message)
      }
      console.error('响应错误:', error)
      return Promise.reject(error)
    }
  )
}

// 初始化拦截器
setupInterceptors(instance)

/**
 * 封装的请求方法
 */
export const request = {
  /**
   * GET 请求
   */
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return instance.get(url, config).then((res) => res.data)
  },

  /**
   * POST 请求
   */
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return instance.post(url, data, config).then((res) => res.data)
  },

  /**
   * PUT 请求
   */
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return instance.put(url, data, config).then((res) => res.data)
  },

  /**
   * DELETE 请求
   */
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return instance.delete(url, config).then((res) => res.data)
  },
}

export default instance

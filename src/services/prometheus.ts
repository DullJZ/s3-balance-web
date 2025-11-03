import axios from 'axios'

/**
 * Prometheus 指标
 */
export interface PrometheusMetric {
  name: string
  value: number
  labels: Record<string, string>
}

/**
 * 解析 Prometheus 文本格式
 */
function parsePrometheusText(text: string): PrometheusMetric[] {
  const lines = text.split('\n')
  const metrics: PrometheusMetric[] = []

  for (const line of lines) {
    // 跳过注释和空行
    if (line.startsWith('#') || line.trim() === '') continue

    // 解析格式：metric_name{label1="value1",label2="value2"} value
    const matchWithLabels = line.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)\{([^}]*)\}\s+(.+)$/)
    if (matchWithLabels) {
      const [, name, labelsStr, valueStr] = matchWithLabels
      const labels: Record<string, string> = {}

      // 解析标签
      const labelPairs = labelsStr.split(',')
      for (const pair of labelPairs) {
        const equalIndex = pair.indexOf('=')
        if (equalIndex > 0) {
          const key = pair.substring(0, equalIndex).trim()
          const value = pair.substring(equalIndex + 1).trim().replace(/"/g, '')
          labels[key] = value
        }
      }

      metrics.push({
        name,
        value: parseFloat(valueStr),
        labels,
      })
      continue
    }

    // 没有标签的格式：metric_name value
    const simpleMatch = line.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)\s+(.+)$/)
    if (simpleMatch) {
      metrics.push({
        name: simpleMatch[1],
        value: parseFloat(simpleMatch[2]),
        labels: {},
      })
    }
  }

  return metrics
}

/**
 * Prometheus 指标相关 API
 */
export const prometheusApi = {
  /**
   * 获取所有指标
   */
  async getMetrics(): Promise<PrometheusMetric[]> {
    try {
      const response = await axios.get('/metrics', {
        responseType: 'text',
        timeout: 10000,
      })
      return parsePrometheusText(response.data)
    } catch (error) {
      console.error('获取 Prometheus 指标失败:', error)
      return []
    }
  },

  /**
   * 获取特定指标
   */
  async getMetricByName(name: string): Promise<PrometheusMetric[]> {
    const metrics = await this.getMetrics()
    return metrics.filter((m) => m.name === name)
  },

  /**
   * 获取桶操作统计
   */
  async getBucketOperations(): Promise<Record<string, number>> {
    const metrics = await this.getMetricByName('s3_balance_operations_total')
    const result: Record<string, number> = {}

    for (const metric of metrics) {
      const bucket = metric.labels.bucket || 'unknown'
      result[bucket] = (result[bucket] || 0) + metric.value
    }

    return result
  },

  /**
   * 获取请求延迟统计
   */
  async getRequestLatency(): Promise<Record<string, number>> {
    const metrics = await this.getMetricByName('s3_balance_request_duration_seconds')
    const result: Record<string, number> = {}

    for (const metric of metrics) {
      const bucket = metric.labels.bucket || 'unknown'
      const quantile = metric.labels.quantile || 'avg'
      const key = `${bucket}_${quantile}`
      result[key] = metric.value
    }

    return result
  },

  /**
   * 获取桶健康状态（从指标）
   */
  async getBucketHealthFromMetrics(): Promise<Record<string, boolean>> {
    const metrics = await this.getMetricByName('s3_balance_bucket_healthy')
    const result: Record<string, boolean> = {}

    for (const metric of metrics) {
      const bucket = metric.labels.bucket || 'unknown'
      result[bucket] = metric.value === 1
    }

    return result
  },
}

export default prometheusApi

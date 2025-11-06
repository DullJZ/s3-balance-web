<template>
  <div class="balancer-config">
    <h1 class="page-title">负载均衡配置</h1>

    <!-- 当前策略 -->
    <el-card shadow="hover" style="margin-bottom: 20px">
      <template #header>
        <div class="card-header">
          <span>负载均衡策略</span>
          <el-button type="primary" @click="saveConfig">保存配置</el-button>
        </div>
      </template>
      <el-form :model="config" label-width="140px">
        <el-form-item label="负载策略">
          <el-radio-group v-model="config.strategy">
            <el-radio label="round-robin">轮询（Round Robin）</el-radio>
            <el-radio label="least-space">最少剩余空间（Least Space）</el-radio>
            <el-radio label="weighted">加权随机（Weighted）</el-radio>
            <el-radio label="consistent-hash">一致性哈希（Consistent Hash）</el-radio>
          </el-radio-group>
          <div class="strategy-desc">
            {{ getStrategyDescription(config.strategy) }}
          </div>
        </el-form-item>

        <el-form-item label="健康检查周期">
          <el-input v-model="config.health_check_period" placeholder="如: 30s">
            <template #append>秒</template>
          </el-input>
        </el-form-item>

        <el-form-item label="统计更新周期">
          <el-input v-model="config.update_stats_period" placeholder="如: 60s">
            <template #append>秒</template>
          </el-input>
        </el-form-item>

        <el-form-item label="重试次数">
          <el-input-number v-model="config.retry_attempts" :min="1" :max="10" />
        </el-form-item>

        <el-form-item label="重试延迟">
          <el-input v-model="config.retry_delay" placeholder="如: 1s">
            <template #append>秒</template>
          </el-input>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 负载分布可视化 -->
    <el-row :gutter="20">
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>请求分布</span>
              <el-button text @click="refreshData">刷新</el-button>
            </div>
          </template>
          <div ref="requestChartRef" style="height: 350px"></div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>存储容量分布</span>
              <el-button text @click="refreshData">刷新</el-button>
            </div>
          </template>
          <div ref="storageChartRef" style="height: 350px"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 存储桶负载统计 -->
    <el-card shadow="hover" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>存储桶负载统计</span>
          <el-button text @click="refreshData">刷新</el-button>
        </div>
      </template>
      <el-table :data="bucketLoadStats" style="width: 100%">
        <el-table-column prop="name" label="存储桶名称" min-width="150" />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.virtual ? 'primary' : 'info'" size="small">
              {{ row.virtual ? '虚拟桶' : '真实桶' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="weight" label="权重" width="80" align="center" />
        <el-table-column prop="requestCount" label="请求数" width="120" align="right">
          <template #default="{ row }">
            {{ formatNumber(row.requestCount) }}
          </template>
        </el-table-column>
        <el-table-column label="请求占比" width="150">
          <template #default="{ row }">
            <el-progress :percentage="row.requestPercent" :stroke-width="16" />
          </template>
        </el-table-column>
        <el-table-column prop="usedSpace" label="已用空间" width="120">
          <template #default="{ row }">
            {{ formatBytes(row.usedSpace) }}
          </template>
        </el-table-column>
        <el-table-column prop="availableSpace" label="可用空间" width="120">
          <template #default="{ row }">
            {{ formatBytes(row.availableSpace) }}
          </template>
        </el-table-column>
        <el-table-column label="响应时间" width="120" align="right">
          <template #default="{ row }">
            {{ row.avgResponseTime }}ms
          </template>
        </el-table-column>
        <el-table-column label="健康状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.healthy ? 'success' : 'danger'">
              {{ row.healthy ? '健康' : '异常' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import type { ECharts } from 'echarts'
import { formatBytes, formatNumber } from '@/utils/format'
import { ElMessage } from 'element-plus'
import { bucketApi } from '@/services/bucket'
import { prometheusApi } from '@/services/prometheus'

// 配置数据
const config = ref({
  strategy: 'least-space',
  health_check_period: '30s',
  update_stats_period: '60s',
  retry_attempts: 3,
  retry_delay: '1s',
})

// 存储桶负载统计
const bucketLoadStats = ref<any[]>([])

// 图表
const requestChartRef = ref<HTMLElement>()
const storageChartRef = ref<HTMLElement>()
let requestChart: ECharts | null = null
let storageChart: ECharts | null = null

onMounted(async () => {
  await loadConfig()
  initCharts() // 先创建图表实例
  await loadLoadStats() // 再加载数据并更新图表
})

// 加载配置
const loadConfig = async () => {
  try {
    // TODO: 后续从 API 获取真实配置
    // 暂时从 localStorage 读取配置，如果没有则使用默认值
    const savedConfig = localStorage.getItem('balancer-config')
    if (savedConfig) {
      config.value = JSON.parse(savedConfig)
    } else {
      config.value = {
        strategy: 'least-space',
        health_check_period: '30s',
        update_stats_period: '60s',
        retry_attempts: 3,
        retry_delay: '1s',
      }
    }
  } catch (error) {
    console.error('加载配置失败:', error)
  }
}

// 加载负载统计
const loadLoadStats = async () => {
  try {
    // 从 API 获取真实数据
    const [buckets, bucketOperations] = await Promise.all([
      bucketApi.getBuckets(),
      prometheusApi.getBucketOperations(),
    ])

    // 获取每个桶的详细信息
    const bucketsWithDetails = await Promise.all(
      buckets.map(async (bucket) => {
        const detail = await bucketApi.getBucketDetail(bucket.name)
        const requestCount = bucketOperations[bucket.name] || 0

        return {
          name: bucket.name,
          virtual: bucket.virtual ?? false,
          weight: bucket.weight,
          requestCount,
          requestPercent: 0, // 会在下面计算
          usedSpace: detail.used_size || 0, // 直接从顶层获取
          availableSpace: detail.available_size || 0, // 直接从顶层获取
          avgResponseTime: 0, // API未提供响应时间
          healthy: detail.available ?? false, // 直接从顶层获取
        }
      })
    )

    // 计算请求百分比
    const totalRequests = bucketsWithDetails.reduce((sum, b) => sum + b.requestCount, 0)
    bucketsWithDetails.forEach((bucket) => {
      bucket.requestPercent = totalRequests > 0
        ? Math.round((bucket.requestCount / totalRequests) * 100)
        : 0
    })

    bucketLoadStats.value = bucketsWithDetails

    // 更新图表
    updateCharts(bucketsWithDetails)
  } catch (error) {
    console.error('加载负载统计失败:', error)
  }
}

// 初始化图表
const initCharts = () => {
  // 请求分布图表
  if (requestChartRef.value) {
    // 先销毁旧实例（如果存在）
    if (requestChart) {
      requestChart.dispose()
      requestChart = null
    }
    requestChart = echarts.init(requestChartRef.value)
    requestChart.setOption({
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
      },
      series: [
        {
          name: '请求分布',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: false,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
            },
          },
          data: [], // 空数据，等待loadLoadStats加载真实数据
        },
      ],
    })
  }

  // 存储容量分布图表
  if (storageChartRef.value) {
    // 先销毁旧实例（如果存在）
    if (storageChart) {
      storageChart.dispose()
      storageChart = null
    }
    storageChart = echarts.init(storageChartRef.value)
    storageChart.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      legend: {
        data: ['已用空间', '可用空间'],
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: [], // 空数据，等待loadLoadStats加载真实数据
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => formatBytes(value * 1024 * 1024 * 1024),
        },
      },
      series: [
        {
          name: '已用空间',
          type: 'bar',
          stack: 'total',
          data: [], // 空数据，等待loadLoadStats加载真实数据
          itemStyle: { color: '#E6A23C' },
        },
        {
          name: '可用空间',
          type: 'bar',
          stack: 'total',
          data: [], // 空数据，等待loadLoadStats加载真实数据
          itemStyle: { color: '#67C23A' },
        },
      ],
    })
  }

  window.addEventListener('resize', handleResize)
}

// 处理窗口调整
const handleResize = () => {
  requestChart?.resize()
  storageChart?.resize()
}

// 刷新数据
const refreshData = async () => {
  await loadLoadStats()
  ElMessage.success('数据已刷新')
}

// 更新图表数据
const updateCharts = (data: any[]) => {
  // 更新请求分布图表
  if (requestChart) {
    const pieData = data.map((item) => ({
      value: item.requestCount,
      name: item.name,
    }))
    requestChart.setOption({
      series: [{ data: pieData }],
    })
  }

  // 更新存储容量分布图表
  if (storageChart) {
    const bucketNames = data.map((item) => item.name)
    const usedData = data.map((item) => Math.round(item.usedSpace / (1024 * 1024 * 1024)))
    const availableData = data.map((item) => Math.round(item.availableSpace / (1024 * 1024 * 1024)))

    storageChart.setOption({
      xAxis: { data: bucketNames },
      series: [
        { name: '已用空间', data: usedData },
        { name: '可用空间', data: availableData },
      ],
    })
  }
}

// 保存配置
const saveConfig = async () => {
  try {
    // TODO: 后续调用 API 保存配置
    // 暂时保存到 localStorage
    localStorage.setItem('balancer-config', JSON.stringify(config.value))
    ElMessage.success('配置已保存')
  } catch (error) {
    console.error('保存配置失败:', error)
    ElMessage.error('保存配置失败')
  }
}

// 获取策略描述
const getStrategyDescription = (strategy: string) => {
  const descriptions: Record<string, string> = {
    'round-robin': '按顺序依次分配请求到各个存储桶，适合负载均匀的场景',
    'least-space': '选择剩余空间最多的存储桶，适合空间利用优先的场景',
    'weighted': '根据权重随机分配请求，适合需要手动控制流量分配的场景',
    'consistent-hash': '基于对象键的一致性哈希，确保相同对象总是路由到同一存储桶',
  }
  return descriptions[strategy] || ''
}

onUnmounted(() => {
  // 移除事件监听
  window.removeEventListener('resize', handleResize)

  // 销毁图表实例
  if (requestChart) {
    requestChart.dispose()
    requestChart = null
  }
  if (storageChart) {
    storageChart.dispose()
    storageChart = null
  }
})
</script>

<style scoped>
.balancer-config {
  width: 100%;
}

.page-title {
  margin: 0 0 20px 0;
  font-size: 24px;
  font-weight: 500;
  color: #303133;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.strategy-desc {
  margin-top: 8px;
  font-size: 13px;
  color: #909399;
  line-height: 1.5;
}
</style>

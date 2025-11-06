<template>
  <div class="dashboard">
    <h1 class="page-title">仪表盘</h1>

    <!-- 统计卡片 -->
    <el-row :gutter="20">
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon :size="40" color="#409EFF" class="stat-icon">
              <Folder />
            </el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalBuckets }}</div>
              <div class="stat-label">存储桶总数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon :size="40" color="#67C23A" class="stat-icon">
              <Document />
            </el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ formatNumber(stats.totalObjects) }}</div>
              <div class="stat-label">对象总数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon :size="40" color="#E6A23C" class="stat-icon">
              <PieChart />
            </el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ formatBytes(stats.totalSize) }}</div>
              <div class="stat-label">总存储空间</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon :size="40" color="#F56C6C" class="stat-icon">
              <Histogram />
            </el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ formatNumber(stats.totalOperations) }}</div>
              <div class="stat-label">总操作次数</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <!-- 存储桶使用率 -->
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>存储桶使用率</span>
              <el-button text @click="refreshData">刷新</el-button>
            </div>
          </template>
          <div ref="bucketUsageChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>

      <!-- 操作统计 -->
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>操作统计（本月）</span>
              <el-button text @click="refreshData">刷新</el-button>
            </div>
          </template>
          <div ref="operationChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 存储桶健康状态 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>存储桶健康状态</span>
              <el-button text @click="refreshData">刷新</el-button>
            </div>
          </template>
          <el-table :data="bucketHealthData" style="width: 100%">
            <el-table-column prop="name" label="存储桶名称" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.healthy ? 'success' : 'danger'">
                  {{ row.healthy ? '健康' : '异常' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag :type="row.virtual ? 'primary' : 'info'" size="small">
                  {{ row.virtual ? '虚拟桶' : '真实桶' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="使用率" width="150">
              <template #default="{ row }">
                <el-progress :percentage="row.usagePercent" :status="getProgressStatus(row.usagePercent)" />
              </template>
            </el-table-column>
            <el-table-column prop="responseTime" label="响应时间" width="120">
              <template #default="{ row }">
                {{ row.responseTime }}ms
              </template>
            </el-table-column>
            <el-table-column prop="lastCheck" label="最后检查时间" width="180" />
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button text type="primary" size="small" @click="viewBucketDetail(row.name)">
                  查看详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Folder, Document, PieChart, Histogram } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { ECharts } from 'echarts'
import { formatBytes, formatNumber, formatDateTime } from '@/utils/format'
import { ElMessage } from 'element-plus'
import { bucketApi } from '@/services/bucket'
import { healthApi } from '@/services/health'
import { prometheusApi } from '@/services/prometheus'

const router = useRouter()

// 统计数据
const stats = ref({
  totalBuckets: 0,
  totalObjects: 0,
  totalSize: 0,
  totalOperations: 0,
})

// 存储桶健康数据
const bucketHealthData = ref<any[]>([])

// 图表实例
const bucketUsageChartRef = ref<HTMLElement>()
const operationChartRef = ref<HTMLElement>()
let bucketUsageChart: ECharts | null = null
let operationChart: ECharts | null = null
let refreshTimer: number | null = null

// 初始化数据
onMounted(async () => {
  initCharts() // 先创建图表实例
  await loadData() // 再加载数据并更新图表
  // 自动刷新（每30秒）
  refreshTimer = setInterval(refreshData, 30000)
})

// 加载数据
const loadData = async () => {
  try {
    // 并行获取所有数据
    const [buckets, systemHealth, bucketOperations] = await Promise.all([
      bucketApi.getBuckets(),
      healthApi.getSystemHealth(),
      prometheusApi.getBucketOperations(),
    ])

    // 计算统计数据
    let totalObjects = 0
    let totalSize = 0
    let totalOperations = 0

    // 从桶详情计算总对象数和总大小
    const bucketDetails = await Promise.all(
      buckets.map((bucket) => bucketApi.getBucketDetail(bucket.name))
    )

    for (const detail of bucketDetails) {
      if (detail.stats) {
        totalObjects += detail.stats.object_count || 0
        totalSize += detail.stats.used_size || 0
      }
    }

    // 计算总操作数
    totalOperations = Object.values(bucketOperations).reduce((sum, count) => sum + count, 0)

    // 更新统计数据
    stats.value = {
      totalBuckets: buckets.length,
      totalObjects,
      totalSize,
      totalOperations,
    }

    // 构建健康状态表格数据
    bucketHealthData.value = await Promise.all(
      buckets.map(async (bucket) => {
        const detail = await bucketApi.getBucketDetail(bucket.name)
        const health = detail.health

        return {
          name: bucket.name,
          healthy: health?.healthy ?? false,
          virtual: bucket.virtual ?? false,
          usagePercent: detail.stats?.usage_percent ?? 0,
          responseTime: health?.response_time ?? 0,
          lastCheck: health?.last_check ? formatDateTime(new Date(health.last_check)) : '未检查',
        }
      })
    )

    // 更新图表数据
    updateCharts(buckets, bucketDetails, bucketOperations)
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败，显示模拟数据')
  }
}

// 更新图表数据
const updateCharts = (buckets: any[], bucketDetails: any[], bucketOperations: Record<string, number>) => {
  // 更新存储桶使用率图表
  if (bucketUsageChart) {
    const pieData = bucketDetails.map((detail) => ({
      value: Math.round((detail.stats?.used_size || 0) / (1024 * 1024 * 1024)), // 转换为GB
      name: detail.name,
    }))

    bucketUsageChart.setOption({
      series: [
        {
          data: pieData,
        },
      ],
    })
  }

  // 更新操作统计图表
  if (operationChart) {
    const bucketNames = bucketDetails.map((detail) => detail.name)
    // 使用真实的操作计数数据
    const readData = bucketDetails.map((detail) => detail.operation_count_b || 0) // B类操作（读取类）
    const writeData = bucketDetails.map((detail) => detail.operation_count_a || 0) // A类操作（写入类）

    operationChart.setOption({
      xAxis: {
        data: bucketNames,
      },
      series: [
        {
          name: '读操作',
          data: readData,
        },
        {
          name: '写操作',
          data: writeData,
        },
      ],
    })
  }
}

// 初始化图表
const initCharts = () => {
  if (bucketUsageChartRef.value) {
    // 先销毁旧实例（如果存在）
    if (bucketUsageChart) {
      bucketUsageChart.dispose()
      bucketUsageChart = null
    }
    bucketUsageChart = echarts.init(bucketUsageChartRef.value)
    bucketUsageChart.setOption({
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}GB ({d}%)',
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
      },
      series: [
        {
          name: '存储桶使用',
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
          data: [], // 空数据，等待loadData加载真实数据
        },
      ],
    })
  }

  if (operationChartRef.value) {
    // 先销毁旧实例（如果存在）
    if (operationChart) {
      operationChart.dispose()
      operationChart = null
    }
    operationChart = echarts.init(operationChartRef.value)
    operationChart.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      legend: {
        data: ['读操作', '写操作'],
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: [], // 空数据，等待loadData加载真实数据
      },
      yAxis: {
        type: 'value',
      },
      series: [
        {
          name: '读操作',
          type: 'bar',
          data: [], // 空数据，等待loadData加载真实数据
          itemStyle: { color: '#409EFF' },
        },
        {
          name: '写操作',
          type: 'bar',
          data: [], // 空数据，等待loadData加载真实数据
          itemStyle: { color: '#67C23A' },
        },
      ],
    })
  }

  // 响应式调整
  window.addEventListener('resize', handleResize)
}

// 处理窗口调整
const handleResize = () => {
  bucketUsageChart?.resize()
  operationChart?.resize()
}

// 刷新数据
const refreshData = async () => {
  await loadData()
  ElMessage.success('数据已刷新')
}

// 获取进度条状态
const getProgressStatus = (percent: number) => {
  if (percent >= 90) return 'exception'
  if (percent >= 75) return 'warning'
  return ''
}

// 查看存储桶详情
const viewBucketDetail = (name: string) => {
  router.push(`/buckets/${name}`)
}

// 组件卸载时清理
onUnmounted(() => {
  // 清理定时器
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }

  // 移除事件监听
  window.removeEventListener('resize', handleResize)

  // 销毁图表实例
  if (bucketUsageChart) {
    bucketUsageChart.dispose()
    bucketUsageChart = null
  }
  if (operationChart) {
    operationChart.dispose()
    operationChart = null
  }
})
</script>

<style scoped>
.dashboard {
  width: 100%;
}

.page-title {
  margin: 0 0 20px 0;
  font-size: 24px;
  font-weight: 500;
  color: #303133;
}

.stat-card {
  margin-bottom: 20px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  flex-shrink: 0;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>

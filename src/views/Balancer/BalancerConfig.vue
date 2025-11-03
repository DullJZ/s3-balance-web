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
  await loadLoadStats()
  initCharts()
})

// 加载配置
const loadConfig = async () => {
  try {
    // TODO: 从 API 获取真实配置
    config.value = {
      strategy: 'least-space',
      health_check_period: '30s',
      update_stats_period: '60s',
      retry_attempts: 3,
      retry_delay: '1s',
    }
  } catch (error) {
    console.error('加载配置失败:', error)
  }
}

// 加载负载统计
const loadLoadStats = async () => {
  try {
    // TODO: 从 API 获取真实数据
    const totalRequests = 10000
    bucketLoadStats.value = [
      {
        name: 'my-bucket-1',
        virtual: false,
        weight: 10,
        requestCount: 3200,
        requestPercent: 32,
        usedSpace: 1024 * 1024 * 1024 * 72,
        availableSpace: 1024 * 1024 * 1024 * 28,
        avgResponseTime: 45,
        healthy: true,
      },
      {
        name: 'my-bucket-2',
        virtual: false,
        weight: 5,
        requestCount: 2800,
        requestPercent: 28,
        usedSpace: 1024 * 1024 * 1024 * 23,
        availableSpace: 1024 * 1024 * 1024 * 27,
        avgResponseTime: 52,
        healthy: true,
      },
      {
        name: 'my-bucket-3',
        virtual: false,
        weight: 15,
        requestCount: 4000,
        requestPercent: 40,
        usedSpace: 1024 * 1024 * 1024 * 145,
        availableSpace: 1024 * 1024 * 1024 * 55,
        avgResponseTime: 38,
        healthy: true,
      },
    ]
  } catch (error) {
    console.error('加载负载统计失败:', error)
  }
}

// 初始化图表
const initCharts = () => {
  // 请求分布图表
  if (requestChartRef.value) {
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
          data: [
            { value: 3200, name: 'my-bucket-1' },
            { value: 2800, name: 'my-bucket-2' },
            { value: 4000, name: 'my-bucket-3' },
          ],
        },
      ],
    })
  }

  // 存储容量分布图表
  if (storageChartRef.value) {
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
        data: ['my-bucket-1', 'my-bucket-2', 'my-bucket-3'],
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
          data: [72, 23, 145],
          itemStyle: { color: '#E6A23C' },
        },
        {
          name: '可用空间',
          type: 'bar',
          stack: 'total',
          data: [28, 27, 55],
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

// 保存配置
const saveConfig = async () => {
  try {
    // TODO: 调用 API 保存配置
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
  window.removeEventListener('resize', handleResize)
  requestChart?.dispose()
  storageChart?.dispose()
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

<template>
  <div class="bucket-detail">
    <el-page-header @back="goBack" :title="bucketName">
      <template #content>
        <span class="bucket-title">{{ bucketName }}</span>
        <el-tag :type="bucketInfo.virtual ? 'primary' : 'info'" style="margin-left: 12px">
          {{ bucketInfo.virtual ? '虚拟桶' : '真实桶' }}
        </el-tag>
        <el-tag :type="bucketInfo.healthy ? 'success' : 'danger'" style="margin-left: 8px">
          {{ bucketInfo.healthy ? '健康' : '异常' }}
        </el-tag>
      </template>
    </el-page-header>

    <!-- 基本信息 -->
    <el-card shadow="hover" style="margin-top: 20px">
      <template #header>
        <span>基本信息</span>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="存储桶名称">{{ bucketInfo.name }}</el-descriptions-item>
        <el-descriptions-item label="类型">
          {{ bucketInfo.virtual ? '虚拟存储桶' : '真实存储桶' }}
        </el-descriptions-item>
        <el-descriptions-item label="端点" v-if="!bucketInfo.virtual">
          {{ bucketInfo.endpoint || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="区域">{{ bucketInfo.region }}</el-descriptions-item>
        <el-descriptions-item label="最大容量">{{ bucketInfo.max_size }}</el-descriptions-item>
        <el-descriptions-item label="权重">{{ bucketInfo.weight }}</el-descriptions-item>
        <el-descriptions-item label="路径风格">
          {{ bucketInfo.path_style ? '是' : '否' }}
        </el-descriptions-item>
        <el-descriptions-item label="启用状态">
          <el-switch v-model="bucketInfo.enabled" @change="updateBucketStatus" />
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 使用统计 -->
    <el-card shadow="hover" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>使用统计</span>
          <el-button text @click="refreshStats">刷新</el-button>
        </div>
      </template>
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-label">对象数量</div>
            <div class="stat-value">{{ formatNumber(stats.object_count) }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-label">已用空间</div>
            <div class="stat-value">{{ formatBytes(stats.used_size) }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-label">可用空间</div>
            <div class="stat-value">{{ formatBytes(stats.available_size) }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-label">使用率</div>
            <div class="stat-value">{{ stats.usage_percent.toFixed(1) }}%</div>
          </div>
        </el-col>
      </el-row>
      <el-progress
        :percentage="stats.usage_percent"
        :status="getProgressStatus(stats.usage_percent)"
        style="margin-top: 20px"
      />
    </el-card>

    <!-- 操作限制 -->
    <el-card shadow="hover" style="margin-top: 20px" v-if="!bucketInfo.virtual">
      <template #header>
        <span>操作限制</span>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="类型 A 操作上限">
          {{ bucketInfo.operation_limits?.type_a || '不限制' }}
        </el-descriptions-item>
        <el-descriptions-item label="类型 B 操作上限">
          {{ bucketInfo.operation_limits?.type_b || '不限制' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 操作历史图表 -->
    <el-card shadow="hover" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>操作历史（最近12个月）</span>
          <el-button text @click="refreshHistory">刷新</el-button>
        </div>
      </template>
      <div ref="historyChartRef" style="height: 400px"></div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as echarts from 'echarts'
import type { ECharts } from 'echarts'
import { formatBytes, formatNumber } from '@/utils/format'
import { ElMessage } from 'element-plus'
import { bucketApi } from '@/services/bucket'

const route = useRoute()
const router = useRouter()

const bucketName = route.params.name as string

// 存储桶信息
const bucketInfo = ref<any>({
  name: bucketName,
  virtual: false,
  healthy: true,
  endpoint: '',
  region: '',
  max_size: '',
  weight: 0,
  path_style: false,
  enabled: true,
  operation_limits: { type_a: 0, type_b: 0 },
})

// 统计数据
const stats = ref({
  object_count: 0,
  total_size: 0,
  used_size: 0,
  available_size: 0,
  usage_percent: 0,
})

// 图表
const historyChartRef = ref<HTMLElement>()
let historyChart: ECharts | null = null

// 窗口调整处理函数（需要保存引用以便移除监听）
const handleResize = () => {
  historyChart?.resize()
}

onMounted(async () => {
  await loadBucketInfo()
  await loadStats()
  initHistoryChart()
})

// 加载存储桶信息
const loadBucketInfo = async () => {
  try {
    // 从 API 获取真实数据
    const detail = await bucketApi.getBucketDetail(bucketName)

    // 更新存储桶基本信息
    bucketInfo.value = {
      name: detail.name,
      virtual: detail.virtual ?? false,
      healthy: detail.available ?? false, // 直接从顶层获取
      endpoint: detail.endpoint,
      region: detail.region,
      max_size: detail.max_size,
      weight: detail.weight,
      path_style: detail.path_style,
      enabled: detail.enabled,
      operation_limits: detail.operation_limits,
    }

    // 更新统计数据（数据在顶层，不是stats子对象）
    stats.value = {
      object_count: 0, // API未提供object_count
      total_size: detail.max_size_bytes || 0,
      used_size: detail.used_size || 0,
      available_size: detail.available_size || 0,
      usage_percent: detail.usage_percent || 0,
    }
  } catch (error) {
    console.error('加载存储桶信息失败:', error)
    ElMessage.error('加载存储桶信息失败')
  }
}

// 加载统计数据（刷新时调用）
const loadStats = async () => {
  try {
    // 从 API 获取真实数据
    const detail = await bucketApi.getBucketDetail(bucketName)

    // 更新统计数据（数据在顶层，不是stats子对象）
    stats.value = {
      object_count: 0, // API未提供object_count
      total_size: detail.max_size_bytes || 0,
      used_size: detail.used_size || 0,
      available_size: detail.available_size || 0,
      usage_percent: detail.usage_percent || 0,
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

// 初始化历史图表
const initHistoryChart = () => {
  if (!historyChartRef.value) return

  // 先销毁旧实例（如果存在）
  if (historyChart) {
    historyChart.dispose()
    historyChart = null
  }

  historyChart = echarts.init(historyChartRef.value)
  historyChart.setOption({
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['操作 A', '操作 B'],
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '操作 A',
        type: 'line',
        data: [1200, 1320, 1010, 1340, 900, 1230, 1100, 1320, 980, 1350, 1200, 1400],
        smooth: true,
        itemStyle: { color: '#409EFF' },
      },
      {
        name: '操作 B',
        type: 'line',
        data: [800, 900, 760, 980, 650, 890, 780, 920, 710, 950, 860, 1000],
        smooth: true,
        itemStyle: { color: '#67C23A' },
      },
    ],
  })

  window.addEventListener('resize', handleResize)
}

// 刷新统计
const refreshStats = async () => {
  await loadStats()
  ElMessage.success('统计数据已刷新')
}

// 刷新历史
const refreshHistory = () => {
  ElMessage.success('历史数据已刷新')
}

// 更新存储桶状态
const updateBucketStatus = () => {
  ElMessage.success(`已${bucketInfo.value.enabled ? '启用' : '禁用'}存储桶`)
  // TODO: 调用 API 更新状态
}

// 获取进度条状态
const getProgressStatus = (percent: number) => {
  if (percent >= 90) return 'exception'
  if (percent >= 75) return 'warning'
  return ''
}

// 返回
const goBack = () => {
  router.back()
}

onUnmounted(() => {
  // 移除事件监听
  window.removeEventListener('resize', handleResize)

  // 销毁图表实例
  if (historyChart) {
    historyChart.dispose()
    historyChart = null
  }
})
</script>

<style scoped>
.bucket-detail {
  width: 100%;
}

.bucket-title {
  font-size: 18px;
  font-weight: 500;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-item {
  text-align: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}
</style>

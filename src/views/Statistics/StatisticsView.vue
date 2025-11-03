<template>
  <div class="statistics-view">
    <h1 class="page-title">统计监控</h1>

    <!-- 查询条件 -->
    <el-card shadow="never" style="margin-bottom: 20px">
      <el-form :inline="true" :model="queryForm">
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="monthrange"
            range-separator="至"
            start-placeholder="开始月份"
            end-placeholder="结束月份"
            value-format="YYYY-MM"
          />
        </el-form-item>
        <el-form-item label="存储桶">
          <el-select v-model="queryForm.bucket" placeholder="请选择存储桶" clearable style="width: 200px">
            <el-option label="全部" value="" />
            <el-option
              v-for="bucket in bucketList"
              :key="bucket"
              :label="bucket"
              :value="bucket"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="queryStats">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
          <el-button type="success" @click="exportData">导出数据</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 统计汇总 -->
    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="8">
        <el-card shadow="hover">
          <el-statistic title="总操作次数" :value="summary.totalOperations">
            <template #suffix>次</template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <el-statistic title="操作 A 总计" :value="summary.totalOperationA">
            <template #suffix>次</template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <el-statistic title="操作 B 总计" :value="summary.totalOperationB">
            <template #suffix>次</template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- 趋势图表 -->
    <el-card shadow="hover" style="margin-bottom: 20px">
      <template #header>
        <div class="card-header">
          <span>操作趋势</span>
          <el-radio-group v-model="chartType" size="small">
            <el-radio-button label="line">折线图</el-radio-button>
            <el-radio-button label="bar">柱状图</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <div ref="trendChartRef" style="height: 400px"></div>
    </el-card>

    <!-- 详细数据表格 -->
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>详细统计数据</span>
          <el-button text @click="refreshData">刷新</el-button>
        </div>
      </template>
      <el-table :data="statsData" style="width: 100%" stripe border>
        <el-table-column prop="year" label="年份" width="100" align="center" />
        <el-table-column prop="month" label="月份" width="100" align="center">
          <template #default="{ row }">
            {{ row.month }}月
          </template>
        </el-table-column>
        <el-table-column prop="bucket" label="存储桶" min-width="150" />
        <el-table-column prop="stats.operation_count_a" label="操作 A" width="120" align="right">
          <template #default="{ row }">
            {{ formatNumber(row.stats.operation_count_a) }}
          </template>
        </el-table-column>
        <el-table-column prop="stats.operation_count_b" label="操作 B" width="120" align="right">
          <template #default="{ row }">
            {{ formatNumber(row.stats.operation_count_b) }}
          </template>
        </el-table-column>
        <el-table-column prop="stats.total" label="总计" width="120" align="right">
          <template #default="{ row }">
            {{ formatNumber(row.stats.total) }}
          </template>
        </el-table-column>
        <el-table-column label="操作占比" width="200">
          <template #default="{ row }">
            <div style="display: flex; gap: 4px; align-items: center">
              <span style="font-size: 12px">A:</span>
              <el-progress
                :percentage="getPercent(row.stats.operation_count_a, row.stats.total)"
                :show-text="false"
                :stroke-width="12"
                style="flex: 1"
              />
              <span style="font-size: 12px">B:</span>
              <el-progress
                :percentage="getPercent(row.stats.operation_count_b, row.stats.total)"
                :show-text="false"
                :stroke-width="12"
                color="#67C23A"
                style="flex: 1"
              />
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 20px; justify-content: flex-end"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import type { ECharts } from 'echarts'
import { formatNumber } from '@/utils/format'
import { ElMessage } from 'element-plus'
import statsApi from '@/services/stats'

// 查询表单
const queryForm = ref({
  bucket: '',
  startYear: 0,
  startMonth: 0,
  endYear: 0,
  endMonth: 0,
})

const dateRange = ref<[string, string]>([])

// 存储桶列表
const bucketList = ref<string[]>([])

// 图表类型
const chartType = ref('line')

// 统计数据
const statsData = ref<any[]>([])

// 分页
const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0,
})

// 统计汇总
const summary = computed(() => {
  const totalOperationA = statsData.value.reduce((sum, item) => sum + item.stats.operation_count_a, 0)
  const totalOperationB = statsData.value.reduce((sum, item) => sum + item.stats.operation_count_b, 0)
  return {
    totalOperations: totalOperationA + totalOperationB,
    totalOperationA,
    totalOperationB,
  }
})

// 图表
const trendChartRef = ref<HTMLElement>()
let trendChart: ECharts | null = null

onMounted(async () => {
  await loadBucketList()
  await loadDefaultData()
  initTrendChart()
})

// 加载存储桶列表
const loadBucketList = async () => {
  try {
    // TODO: 从 API 获取存储桶列表
    bucketList.value = ['user-bucket-1', 'user-bucket-2', 'my-bucket-1', 'my-bucket-2', 'my-bucket-3']
  } catch (error) {
    console.error('加载存储桶列表失败:', error)
  }
}

// 加载默认数据（当前月份）
const loadDefaultData = async () => {
  try {
    const data = await statsApi.getCurrentMonthStats()
    statsData.value = data
    pagination.value.total = data.length
  } catch (error) {
    console.error('加载统计数据失败:', error)
    ElMessage.error('加载统计数据失败')
  }
}

// 查询统计
const queryStats = async () => {
  try {
    if (dateRange.value && dateRange.value.length === 2) {
      const [start, end] = dateRange.value
      const [startYear, startMonth] = start.split('-').map(Number)
      const [endYear, endMonth] = end.split('-').map(Number)

      const data = await statsApi.getMonthlyStatsRange({
        start_year: startYear,
        start_month: startMonth,
        end_year: endYear,
        end_month: endMonth,
      })

      if (queryForm.value.bucket) {
        statsData.value = data.filter((item) => item.bucket === queryForm.value.bucket)
      } else {
        statsData.value = data
      }

      pagination.value.total = statsData.value.length
      updateTrendChart()
      ElMessage.success('查询成功')
    } else {
      ElMessage.warning('请选择时间范围')
    }
  } catch (error) {
    console.error('查询统计失败:', error)
    ElMessage.error('查询统计失败')
  }
}

// 重置查询
const resetQuery = () => {
  queryForm.value = {
    bucket: '',
    startYear: 0,
    startMonth: 0,
    endYear: 0,
    endMonth: 0,
  }
  dateRange.value = []
  loadDefaultData()
}

// 导出数据
const exportData = () => {
  ElMessage.info('导出功能开发中...')
  // TODO: 实现数据导出功能（CSV/JSON）
}

// 刷新数据
const refreshData = () => {
  queryStats()
}

// 初始化趋势图表
const initTrendChart = () => {
  if (!trendChartRef.value) return

  trendChart = echarts.init(trendChartRef.value)
  updateTrendChart()

  window.addEventListener('resize', () => trendChart?.resize())
}

// 更新趋势图表
const updateTrendChart = () => {
  if (!trendChart) return

  // 按时间分组数据
  const groupedData = new Map<string, any>()
  statsData.value.forEach((item) => {
    const key = `${item.year}-${item.month}`
    if (!groupedData.has(key)) {
      groupedData.set(key, {
        time: key,
        operationA: 0,
        operationB: 0,
      })
    }
    const group = groupedData.get(key)!
    group.operationA += item.stats.operation_count_a
    group.operationB += item.stats.operation_count_b
  })

  const timeLabels = Array.from(groupedData.keys())
  const operationAData = Array.from(groupedData.values()).map((item) => item.operationA)
  const operationBData = Array.from(groupedData.values()).map((item) => item.operationB)

  trendChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
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
      boundaryGap: chartType.value === 'bar',
      data: timeLabels,
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '操作 A',
        type: chartType.value,
        data: operationAData,
        smooth: chartType.value === 'line',
        itemStyle: { color: '#409EFF' },
      },
      {
        name: '操作 B',
        type: chartType.value,
        data: operationBData,
        smooth: chartType.value === 'line',
        itemStyle: { color: '#67C23A' },
      },
    ],
  })
}

// 获取百分比
const getPercent = (value: number, total: number) => {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

// 处理页码变化
const handlePageChange = (page: number) => {
  pagination.value.page = page
}

// 处理每页大小变化
const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size
  pagination.value.page = 1
}

// 监听图表类型变化
watch(chartType, () => {
  updateTrendChart()
})

onUnmounted(() => {
  trendChart?.dispose()
})
</script>

<style scoped>
.statistics-view {
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
</style>

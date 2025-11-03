<template>
  <div class="bucket-list">
    <h1 class="page-title">存储桶管理</h1>

    <!-- 工具栏 -->
    <el-card shadow="never" style="margin-bottom: 20px">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-input v-model="searchText" placeholder="搜索存储桶名称" clearable>
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="8">
          <el-select v-model="filterType" placeholder="存储桶类型" clearable style="width: 100%">
            <el-option label="全部" value="" />
            <el-option label="虚拟桶" value="virtual" />
            <el-option label="真实桶" value="real" />
          </el-select>
        </el-col>
        <el-col :span="8">
          <el-select v-model="filterStatus" placeholder="健康状态" clearable style="width: 100%">
            <el-option label="全部" value="" />
            <el-option label="健康" value="healthy" />
            <el-option label="异常" value="unhealthy" />
          </el-select>
        </el-col>
      </el-row>
    </el-card>

    <!-- 虚拟桶列表 -->
    <el-card shadow="hover" style="margin-bottom: 20px">
      <template #header>
        <div class="card-header">
          <span><el-icon><Folder /></el-icon> 虚拟存储桶</span>
          <el-tag type="primary">{{ virtualBuckets.length }} 个</el-tag>
        </div>
      </template>
      <el-table :data="filteredVirtualBuckets" style="width: 100%">
        <el-table-column prop="name" label="存储桶名称" min-width="150">
          <template #default="{ row }">
            <el-link type="primary" @click="viewDetail(row.name)">
              {{ row.name }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="region" label="区域" width="120" />
        <el-table-column label="最大容量" width="120">
          <template #default="{ row }">
            {{ row.max_size }}
          </template>
        </el-table-column>
        <el-table-column label="使用率" width="180">
          <template #default="{ row }">
            <el-progress :percentage="row.usage_percent" :status="getProgressStatus(row.usage_percent)" />
          </template>
        </el-table-column>
        <el-table-column label="权重" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ row.weight }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch v-model="row.enabled" @change="toggleBucketStatus(row)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="viewDetail(row.name)">
              详情
            </el-button>
            <el-button text type="primary" size="small" @click="editBucket(row)">
              编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 真实桶列表 -->
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span><el-icon><Files /></el-icon> 真实存储桶</span>
          <el-tag type="info">{{ realBuckets.length }} 个</el-tag>
        </div>
      </template>
      <el-table :data="filteredRealBuckets" style="width: 100%">
        <el-table-column prop="name" label="存储桶名称" min-width="150">
          <template #default="{ row }">
            <el-link type="primary" @click="viewDetail(row.name)">
              {{ row.name }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="endpoint" label="端点" min-width="200" show-overflow-tooltip />
        <el-table-column prop="region" label="区域" width="120" />
        <el-table-column label="健康状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.healthy ? 'success' : 'danger'">
              {{ row.healthy ? '健康' : '异常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最大容量" width="120">
          <template #default="{ row }">
            {{ row.max_size }}
          </template>
        </el-table-column>
        <el-table-column label="使用率" width="180">
          <template #default="{ row }">
            <el-progress :percentage="row.usage_percent" :status="getProgressStatus(row.usage_percent)" />
          </template>
        </el-table-column>
        <el-table-column label="权重" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ row.weight }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch v-model="row.enabled" @change="toggleBucketStatus(row)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="viewDetail(row.name)">
              详情
            </el-button>
            <el-button text type="primary" size="small" @click="editBucket(row)">
              编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Folder, Files } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { bucketApi } from '@/services/bucket'

const router = useRouter()

// 搜索和筛选
const searchText = ref('')
const filterType = ref('')
const filterStatus = ref('')

// 存储桶数据
const virtualBuckets = ref<any[]>([])
const realBuckets = ref<any[]>([])

// 过滤后的数据
const filteredVirtualBuckets = computed(() => {
  return filterBuckets(virtualBuckets.value)
})

const filteredRealBuckets = computed(() => {
  return filterBuckets(realBuckets.value)
})

// 过滤逻辑
const filterBuckets = (buckets: any[]) => {
  return buckets.filter((bucket) => {
    // 搜索过滤
    if (searchText.value && !bucket.name.toLowerCase().includes(searchText.value.toLowerCase())) {
      return false
    }
    // 状态过滤
    if (filterStatus.value === 'healthy' && !bucket.healthy) return false
    if (filterStatus.value === 'unhealthy' && bucket.healthy) return false
    return true
  })
}

// 加载数据
onMounted(async () => {
  await loadBuckets()
})

const loadBuckets = async () => {
  try {
    // 从 API 获取真实数据
    const buckets = await bucketApi.getBuckets()

    // 获取每个桶的详细信息（包含使用率和健康状态）
    const bucketsWithDetails = await Promise.all(
      buckets.map(async (bucket) => {
        const detail = await bucketApi.getBucketDetail(bucket.name)
        return {
          name: bucket.name,
          endpoint: bucket.endpoint,
          region: bucket.region,
          max_size: bucket.max_size,
          usage_percent: detail.stats?.usage_percent ?? 0,
          weight: bucket.weight,
          enabled: bucket.enabled,
          healthy: detail.health?.healthy ?? false,
          virtual: bucket.virtual ?? false,
        }
      })
    )

    // 分离虚拟桶和真实桶
    virtualBuckets.value = bucketsWithDetails.filter((b) => b.virtual)
    realBuckets.value = bucketsWithDetails.filter((b) => !b.virtual)
  } catch (error) {
    console.error('加载存储桶失败:', error)
    ElMessage.error('加载存储桶失败')
  }
}

// 获取进度条状态
const getProgressStatus = (percent: number) => {
  if (percent >= 90) return 'exception'
  if (percent >= 75) return 'warning'
  return ''
}

// 查看详情
const viewDetail = (name: string) => {
  router.push(`/buckets/${name}`)
}

// 编辑存储桶
const editBucket = (bucket: any) => {
  ElMessage.info(`编辑存储桶: ${bucket.name}`)
  // TODO: 打开编辑对话框
}

// 切换存储桶状态
const toggleBucketStatus = async (bucket: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要${bucket.enabled ? '启用' : '禁用'}存储桶 ${bucket.name} 吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    // TODO: 调用 API 更新状态
    ElMessage.success(`已${bucket.enabled ? '启用' : '禁用'}存储桶`)
  } catch {
    // 取消操作，恢复原状态
    bucket.enabled = !bucket.enabled
  }
}
</script>

<style scoped>
.bucket-list {
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
  font-weight: 500;
}

.card-header span {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>

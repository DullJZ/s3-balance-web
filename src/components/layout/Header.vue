<template>
  <div class="header">
    <!-- 左侧：折叠按钮 -->
    <div class="header-left">
      <el-icon class="toggle-icon" @click="emit('toggleSidebar')">
        <component :is="isCollapse ? 'Expand' : 'Fold'" />
      </el-icon>
      <h2 class="header-title">S3 Balance 管理面板</h2>
    </div>

    <!-- 右侧：用户信息和操作 -->
    <div class="header-right">
      <!-- 健康状态指示器 -->
      <el-tooltip content="系统健康状态" placement="bottom">
        <el-badge :value="healthStatus.unhealthy" :hidden="healthStatus.unhealthy === 0">
          <el-icon :size="20" :color="healthStatus.color">
            <component :is="healthStatus.icon" />
          </el-icon>
        </el-badge>
      </el-tooltip>

      <!-- 刷新按钮 -->
      <el-tooltip content="刷新数据" placement="bottom">
        <el-icon class="action-icon" :size="20" @click="refreshData">
          <Refresh />
        </el-icon>
      </el-tooltip>

      <!-- 全屏按钮 -->
      <el-tooltip content="全屏" placement="bottom">
        <el-icon class="action-icon" :size="20" @click="toggleFullscreen">
          <FullScreen />
        </el-icon>
      </el-tooltip>

      <!-- 用户菜单 -->
      <el-dropdown>
        <div class="user-info">
          <el-avatar :size="32" :icon="Avatar" />
          <span class="username">管理员</span>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item>个人设置</el-dropdown-item>
            <el-dropdown-item divided>退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Expand, Fold, Refresh, FullScreen, Avatar } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

interface Props {
  isCollapse: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  toggleSidebar: []
}>()

// 健康状态（示例数据，实际应从 store 获取）
const healthStatus = computed(() => {
  const unhealthy = 0 // 不健康��桶数量
  return {
    unhealthy,
    color: unhealthy > 0 ? '#F56C6C' : '#67C23A',
    icon: unhealthy > 0 ? 'WarningFilled' : 'SuccessFilled',
  }
})

// 刷新数据
const refreshData = () => {
  ElMessage.success('数据已刷新')
  // 实际应触发数据刷新逻辑
}

// 切换全屏
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}
</script>

<style scoped>
.header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.toggle-icon {
  font-size: 20px;
  cursor: pointer;
  transition: color 0.3s;
}

.toggle-icon:hover {
  color: #409eff;
}

.header-title {
  font-size: 18px;
  font-weight: 500;
  color: #303133;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.action-icon {
  cursor: pointer;
  transition: color 0.3s;
}

.action-icon:hover {
  color: #409eff;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.username {
  font-size: 14px;
  color: #606266;
}
</style>

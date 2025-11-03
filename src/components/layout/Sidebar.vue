<template>
  <div class="sidebar">
    <!-- Logo 区域 -->
    <div class="logo-container" :class="{ 'logo-collapse': isCollapse }">
      <el-icon :size="28" color="#409eff">
        <Platform />
      </el-icon>
      <transition name="fade">
        <span v-show="!isCollapse" class="logo-text">S3 Balance</span>
      </transition>
    </div>

    <!-- 菜单 -->
    <el-menu
      :default-active="activeMenu"
      :collapse="isCollapse"
      :collapse-transition="false"
      class="sidebar-menu"
      background-color="#304156"
      text-color="#bfcbd9"
      active-text-color="#409eff"
      router
    >
      <template v-for="route in menuRoutes" :key="route.path">
        <el-menu-item
          v-if="!route.meta?.hidden"
          :index="route.path"
          @click="handleMenuClick(route.path)"
        >
          <el-icon>
            <component :is="route.meta?.icon || 'Document'" />
          </el-icon>
          <template #title>{{ route.meta?.title }}</template>
        </el-menu-item>
      </template>
    </el-menu>

    <!-- 版本信息 -->
    <div v-if="!isCollapse" class="version-info">
      <span>版本 v0.1.0</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Platform } from '@element-plus/icons-vue'

interface Props {
  isCollapse: boolean
}

defineProps<Props>()

const route = useRoute()
const router = useRouter()

// 当前激活的菜单
const activeMenu = computed(() => {
  const { path } = route
  // 如果是详情页，高亮父级菜单
  if (path.includes('/buckets/')) {
    return '/buckets'
  }
  return path
})

// 菜单路由列表
const menuRoutes = computed(() => {
  const routes = router.getRoutes()
  const mainRoute = routes.find((r) => r.path === '/')
  return mainRoute?.children || []
})

// 处理菜单点击
const handleMenuClick = (path: string) => {
  router.push(path)
}
</script>

<style scoped>
.sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.logo-container {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 0 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s;
}

.logo-collapse {
  padding: 0;
  justify-content: center;
}

.logo-text {
  font-size: 18px;
  font-weight: bold;
  color: #ffffff;
  white-space: nowrap;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.sidebar-menu {
  flex: 1;
  border-right: none;
  overflow-y: auto;
}

.sidebar-menu:not(.el-menu--collapse) {
  width: 200px;
}

.version-info {
  padding: 16px;
  text-align: center;
  color: #bfcbd9;
  font-size: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
</style>

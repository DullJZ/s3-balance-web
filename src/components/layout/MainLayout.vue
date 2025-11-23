<template>
  <el-container class="main-layout">
    <!-- 桌面端侧边栏 -->
    <el-aside
      v-if="!isMobile"
      :width="isCollapse ? '64px' : '200px'"
      class="aside-container"
    >
      <Sidebar :is-collapse="isCollapse" />
    </el-aside>

    <!-- 移动端抽屉式侧边栏 -->
    <el-drawer
      v-model="mobileDrawerVisible"
      direction="ltr"
      :size="200"
      :show-close="false"
      class="mobile-drawer"
    >
      <Sidebar :is-collapse="false" @menu-click="closeMobileDrawer" />
    </el-drawer>

    <!-- 主内容区 -->
    <el-container>
      <!-- 顶部导航栏 -->
      <el-header class="header-container">
        <Header
          @toggle-sidebar="toggleSidebar"
          :is-collapse="isCollapse"
          :is-mobile="isMobile"
        />
      </el-header>

      <!-- 内容区域 -->
      <el-main class="main-container">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Header from './Header.vue'
import Sidebar from './Sidebar.vue'

// 侧边栏折叠状态
const isCollapse = ref(false)

// 移动端抽屉显示状态
const mobileDrawerVisible = ref(false)

// 屏幕宽度
const screenWidth = ref(window.innerWidth)

// 判断是否为移动端（屏幕宽度小于 768px）
const isMobile = computed(() => screenWidth.value < 768)

// 切换侧边栏
const toggleSidebar = () => {
  if (isMobile.value) {
    // 移动端：切换抽屉显示
    mobileDrawerVisible.value = !mobileDrawerVisible.value
  } else {
    // 桌面端：切换折叠状态
    isCollapse.value = !isCollapse.value
  }
}

// 关闭移动端抽屉
const closeMobileDrawer = () => {
  mobileDrawerVisible.value = false
}

// 监听窗口大小变化
const handleResize = () => {
  screenWidth.value = window.innerWidth
  // 如果切换到桌面端，关闭移动端抽屉
  if (!isMobile.value) {
    mobileDrawerVisible.value = false
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.main-layout {
  width: 100%;
  height: 100%;
}

.aside-container {
  background-color: #304156;
  transition: width 0.3s;
  overflow-x: hidden;
}

.header-container {
  background-color: #ffffff;
  border-bottom: 1px solid #e6e6e6;
  padding: 0 20px;
  display: flex;
  align-items: center;
  height: 60px;
}

.main-container {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .header-container {
    padding: 0 12px;
    height: 50px;
  }

  .main-container {
    padding: 12px;
  }
}

/* 移动端抽屉样式 */
:deep(.mobile-drawer .el-drawer__body) {
  padding: 0;
  background-color: #304156;
}
</style>

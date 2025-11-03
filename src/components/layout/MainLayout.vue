<template>
  <el-container class="main-layout">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '200px'" class="aside-container">
      <Sidebar :is-collapse="isCollapse" />
    </el-aside>

    <!-- 主内容区 -->
    <el-container>
      <!-- 顶部导航栏 -->
      <el-header class="header-container">
        <Header @toggle-sidebar="toggleSidebar" :is-collapse="isCollapse" />
      </el-header>

      <!-- 内容区域 -->
      <el-main class="main-container">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Header from './Header.vue'
import Sidebar from './Sidebar.vue'

// 侧边栏折叠状态
const isCollapse = ref(false)

// 切换侧边栏
const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value
}
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
</style>

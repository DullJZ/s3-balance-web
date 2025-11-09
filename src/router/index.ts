import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/components/layout/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '仪表盘', icon: 'DataAnalysis' },
      },
      {
        path: 'buckets',
        name: 'BucketList',
        component: () => import('@/views/Bucket/BucketList.vue'),
        meta: { title: '存储桶管理', icon: 'Files' },
      },
      {
        path: 'buckets/:name',
        name: 'BucketDetail',
        component: () => import('@/views/Bucket/BucketDetail.vue'),
        meta: { title: '存储桶详情', icon: 'Document', hidden: true },
      },
      {
        path: 'balancer',
        name: 'BalancerConfig',
        component: () => import('@/views/Balancer/BalancerConfig.vue'),
        meta: { title: '负载均衡', icon: 'ScaleToOriginal' },
      },
      {
        path: 'statistics',
        name: 'Statistics',
        component: () => import('@/views/Statistics/StatisticsView.vue'),
        meta: { title: '统计监控', icon: 'TrendCharts' },
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/Settings/SystemConfig.vue'),
        meta: { title: '系统配置', icon: 'Setting' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router

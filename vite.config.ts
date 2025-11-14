import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // 应用部署路径配置
  // 生产环境：从环境变量 VITE_BASE_PATH 读取（默认 /web/）
  // 开发环境：使用根路径 /
  base: mode === 'production' ? (process.env.VITE_BASE_PATH || '/web/') : '/',
  plugins: [
    vue(),
    // 自动导入 Vue API
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      resolvers: [ElementPlusResolver()],
      dts: 'src/auto-imports.d.ts',
    }),
    // 自动导入 Element Plus 组件
    Components({
      resolvers: [ElementPlusResolver()],
      dts: 'src/components.d.ts',
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    // 注意：不使用 vite 代理，所有请求通过前端配置的后端地址
    // 这样用户可以自由配置后端地址，而不受限于开发服务器代理
  },
}))

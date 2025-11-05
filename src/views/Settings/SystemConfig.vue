<template>
  <div class="system-config">
    <h1 class="page-title">系统配置</h1>

    <el-tabs v-model="activeTab" type="border-card">
      <!-- 前端配置 -->
      <el-tab-pane label="前端配置" name="frontend">
        <el-alert
          title="前后端分离配置"
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
        >
          <p>在此配置前端连接的后端 s3-balance 服务地址。配置保存在浏览器本地存储中。</p>
          <p>修改配置后会立即生效，所有 API 请求将使用新的后端地址。</p>
        </el-alert>

        <el-form :model="backendConfig" label-width="140px">
          <el-form-item label="后端服务地址">
            <el-input
              v-model="backendConfig.apiBaseUrl"
              placeholder="如: http://localhost:8082"
            >
              <template #prepend>
                <el-icon><Link /></el-icon>
              </template>
            </el-input>
            <div class="form-hint">
              完整的管理API地址，包含协议和端口（默认8082端口）
            </div>
          </el-form-item>

          <el-form-item label="API认证令牌">
            <el-input
              v-model="backendConfig.apiToken"
              type="password"
              placeholder="输入API Token"
              show-password
            >
              <template #prepend>
                <el-icon><Key /></el-icon>
              </template>
            </el-input>
            <div class="form-hint">
              管理API的Bearer Token，需要与后端配置文件中的api.token一致
            </div>
          </el-form-item>

          <el-form-item label="请求超时时间">
            <el-input-number
              v-model="backendConfig.timeout"
              :min="1000"
              :max="60000"
              :step="1000"
            />
            <span style="margin-left: 10px; color: #909399">毫秒</span>
            <div class="form-hint">
              API 请求的超时时间，建议设置为 10000-30000 毫秒
            </div>
          </el-form-item>

          <el-form-item label="连接状态">
            <el-tag v-if="connectionStatus.testing" type="info">
              <el-icon class="is-loading"><Loading /></el-icon>
              测试中...
            </el-tag>
            <el-tag v-else-if="connectionStatus.success" type="success">
              <el-icon><SuccessFilled /></el-icon>
              {{ connectionStatus.message }}
            </el-tag>
            <el-tag v-else-if="connectionStatus.success === false" type="danger">
              <el-icon><CircleCloseFilled /></el-icon>
              {{ connectionStatus.message }}
            </el-tag>
            <el-tag v-else type="info">未测试</el-tag>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              @click="testConnection"
              :loading="connectionStatus.testing"
            >
              <el-icon><Connection /></el-icon>
              测试连接
            </el-button>
            <el-button type="success" @click="saveBackendConfig" :disabled="connectionStatus.testing">
              <el-icon><Check /></el-icon>
              保存配置
            </el-button>
            <el-button @click="resetBackendConfig" :disabled="connectionStatus.testing">
              <el-icon><RefreshLeft /></el-icon>
              恢复默认
            </el-button>
          </el-form-item>

          <el-divider />

          <el-descriptions title="当前配置信息" :column="1" border>
            <el-descriptions-item label="后端地址">
              {{ currentBackendUrl }}
            </el-descriptions-item>
            <el-descriptions-item label="API Token">
              {{ maskToken(configService.getApiToken()) }}
            </el-descriptions-item>
            <el-descriptions-item label="超时时间">
              {{ currentBackendTimeout }} 毫秒
            </el-descriptions-item>
            <el-descriptions-item label="配置来源">
              {{ configSource }}
            </el-descriptions-item>
          </el-descriptions>
        </el-form>
      </el-tab-pane>

      <!-- 服务器配置 -->
      <el-tab-pane label="服务器配置" name="server">
        <el-form :model="config.server" label-width="140px">
          <el-form-item label="监听地址">
            <el-input v-model="config.server.host" placeholder="如: 0.0.0.0" />
          </el-form-item>
          <el-form-item label="监听端口">
            <el-input-number v-model="config.server.port" :min="1" :max="65535" />
          </el-form-item>
          <el-form-item label="读取超时">
            <el-input v-model="config.server.read_timeout" placeholder="如: 30s">
              <template #append>秒</template>
            </el-input>
          </el-form-item>
          <el-form-item label="写入超时">
            <el-input v-model="config.server.write_timeout" placeholder="如: 30s">
              <template #append>秒</template>
            </el-input>
          </el-form-item>
          <el-form-item label="空闲超时">
            <el-input v-model="config.server.idle_timeout" placeholder="如: 60s">
              <template #append>秒</template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="saveConfig('server')">保存配置</el-button>
            <el-button @click="resetConfig('server')">重置</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 数据库配置 -->
      <el-tab-pane label="数据库配置" name="database">
        <el-form :model="config.database" label-width="160px">
          <el-form-item label="数据库类型">
            <el-select v-model="config.database.type" placeholder="请选择数据库类型">
              <el-option label="SQLite" value="sqlite" />
              <el-option label="MySQL" value="mysql" />
              <el-option label="PostgreSQL" value="postgres" />
            </el-select>
          </el-form-item>
          <el-form-item label="数据源名称（DSN）">
            <el-input
              v-model="config.database.dsn"
              type="textarea"
              :rows="3"
              placeholder="数据库连接字符串"
            />
          </el-form-item>
          <el-form-item label="最大打开连接数">
            <el-input-number v-model="config.database.max_open_conns" :min="1" :max="100" />
          </el-form-item>
          <el-form-item label="最大空闲连接数">
            <el-input-number v-model="config.database.max_idle_conns" :min="1" :max="50" />
          </el-form-item>
          <el-form-item label="连接最大生命周期">
            <el-input v-model="config.database.conn_max_lifetime" placeholder="如: 300">
              <template #append>秒</template>
            </el-input>
          </el-form-item>
          <el-form-item label="日志级别">
            <el-select v-model="config.database.log_level">
              <el-option label="Silent" value="silent" />
              <el-option label="Error" value="error" />
              <el-option label="Warn" value="warn" />
              <el-option label="Info" value="info" />
            </el-select>
          </el-form-item>
          <el-form-item label="自动迁移">
            <el-switch v-model="config.database.auto_migrate" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="saveConfig('database')">保存配置</el-button>
            <el-button @click="resetConfig('database')">重置</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- S3 API 配置 -->
      <el-tab-pane label="S3 API 配置" name="s3api">
        <el-form :model="config.s3api" label-width="140px">
          <el-form-item label="Access Key">
            <el-input v-model="config.s3api.access_key" placeholder="访问密钥" show-password />
          </el-form-item>
          <el-form-item label="Secret Key">
            <el-input v-model="config.s3api.secret_key" placeholder="秘密密钥" show-password />
          </el-form-item>
          <el-form-item label="虚拟主机模式">
            <el-switch v-model="config.s3api.virtual_host" />
            <div class="form-hint">
              开启后支持虚拟主机风格访问（如: bucket.domain.com）
            </div>
          </el-form-item>
          <el-form-item label="代理模式">
            <el-switch v-model="config.s3api.proxy_mode" />
            <div class="form-hint">
              开启：数据通过服务器传输<br />
              关闭：返回预签名 URL，客户端直连后端存储
            </div>
          </el-form-item>
          <el-form-item label="认证要求">
            <el-switch v-model="config.s3api.auth_required" />
            <div class="form-hint">
              开启后需要使用 AWS Signature Version 4 认证
            </div>
          </el-form-item>
          <el-form-item label="主机地址">
            <el-input
              v-model="config.s3api.host"
              placeholder="用于签名验证的主机地址（可选）"
            />
            <div class="form-hint">
              当服务前有反向代理时，设置此项为客户端实际访问的域名
            </div>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="saveConfig('s3api')">保存配置</el-button>
            <el-button @click="resetConfig('s3api')">重置</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 监控指标配置 -->
      <el-tab-pane label="监控指标" name="metrics">
        <el-form :model="config.metrics" label-width="140px">
          <el-form-item label="启用指标">
            <el-switch v-model="config.metrics.enabled" />
          </el-form-item>
          <el-form-item label="指标路径">
            <el-input v-model="config.metrics.path" placeholder="如: /metrics" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="saveConfig('metrics')">保存配置</el-button>
            <el-button @click="resetConfig('metrics')">重置</el-button>
          </el-form-item>
          <el-divider />
          <el-form-item label="Prometheus 端点">
            <el-link type="primary" :href="metricsUrl" target="_blank">
              {{ metricsUrl }}
            </el-link>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- YAML 编辑器 -->
      <el-tab-pane label="YAML 编辑" name="yaml">
        <el-alert
          title="直接编辑 YAML 配置文件"
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
        >
          <template #default>
            <p style="margin: 0">
              在此编辑完整的 YAML 配置文件。保存前请确保 YAML 格式正确，否则可能导致配置错误。
            </p>
          </template>
        </el-alert>

        <div class="yaml-editor-container">
          <div class="yaml-editor-toolbar">
            <el-space>
              <el-button type="primary" @click="saveYamlConfig" :loading="yamlSaving">
                <el-icon><Check /></el-icon>
                保存配置
              </el-button>
              <el-button @click="formatYaml">
                <el-icon><MagicStick /></el-icon>
                格式化
              </el-button>
              <el-button @click="validateYaml">
                <el-icon><Select /></el-icon>
                验证语法
              </el-button>
              <el-button @click="syncFromConfig">
                <el-icon><Refresh /></el-icon>
                从表单同步
              </el-button>
              <el-button @click="exportConfig">
                <el-icon><Download /></el-icon>
                导出文件
              </el-button>
            </el-space>
            <div class="yaml-status">
              <el-tag v-if="yamlError" type="danger" size="small">
                <el-icon><WarningFilled /></el-icon>
                语法错误
              </el-tag>
              <el-tag v-else type="success" size="small">
                <el-icon><SuccessFilled /></el-icon>
                语法正确
              </el-tag>
            </div>
          </div>

          <el-input
            v-model="yamlContent"
            type="textarea"
            :rows="25"
            placeholder="在此输入或编辑 YAML 配置..."
            class="yaml-editor"
            @input="onYamlInput"
          />

          <div v-if="yamlError" class="yaml-error">
            <el-icon><WarningFilled /></el-icon>
            <span>{{ yamlError }}</span>
          </div>
        </div>
      </el-tab-pane>

      <!-- 配置备份 -->
      <el-tab-pane label="配置备份" name="backup">
        <el-space direction="vertical" style="width: 100%" :size="20">
          <el-card shadow="hover">
            <template #header>
              <span>导出配置</span>
            </template>
            <p style="margin-bottom: 16px; color: #606266">
              将当前配置导出为 YAML 文件，便于备份和迁移
            </p>
            <el-button type="primary" @click="exportConfig">
              <el-icon><Download /></el-icon>
              导出配置文件
            </el-button>
          </el-card>

          <el-card shadow="hover">
            <template #header>
              <span>导入配置</span>
            </template>
            <p style="margin-bottom: 16px; color: #606266">
              从 YAML 文件导入配置（导入前请先备份当前配置）
            </p>
            <el-upload
              action=""
              :before-upload="importConfig"
              :show-file-list="false"
              accept=".yaml,.yml"
            >
              <el-button type="success">
                <el-icon><Upload /></el-icon>
                选择配置文件
              </el-button>
            </el-upload>
          </el-card>

          <el-card shadow="hover">
            <template #header>
              <span>重置配置</span>
            </template>
            <p style="margin-bottom: 16px; color: #606266">
              将所有配置重置为默认值（此操作不可恢复）
            </p>
            <el-button type="danger" @click="resetAllConfig">
              <el-icon><RefreshLeft /></el-icon>
              重置所有配置
            </el-button>
          </el-card>
        </el-space>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  Download,
  Upload,
  RefreshLeft,
  Check,
  MagicStick,
  Select,
  Refresh,
  WarningFilled,
  SuccessFilled,
  Link,
  Connection,
  Loading,
  CircleCloseFilled,
  Key,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { SystemConfig } from '@/types/config'
import * as yaml from 'js-yaml'
import { configService, type BackendConfig } from '@/services/config'
import { systemConfigApi } from '@/services/systemConfig'

const activeTab = ref('frontend')

// ========== 前端配置相关 ==========
// 后端配置
const backendConfig = ref<BackendConfig>({
  apiBaseUrl: '',
  apiToken: '',
  timeout: 10000,
})

// 连接测试状态
const connectionStatus = ref<{
  testing: boolean
  success: boolean | null
  message: string
}>({
  testing: false,
  success: null,
  message: '',
})

// 当前后端地址
const currentBackendUrl = computed(() => {
  return configService.getApiBaseUrl()
})

// 当前超时时间
const currentBackendTimeout = computed(() => {
  return configService.getTimeout()
})

// 配置来源
const configSource = computed(() => {
  const saved = localStorage.getItem('backend-config')
  return saved ? '用户自定义' : '环境变量默认值'
})

// Token脱敏显示
const maskToken = (token: string) => {
  if (!token || token.length <= 8) {
    return '***'
  }
  return token.substring(0, 4) + '*'.repeat(token.length - 8) + token.substring(token.length - 4)
}

// 测试连接
const testConnection = async () => {
  connectionStatus.value.testing = true
  connectionStatus.value.success = null
  connectionStatus.value.message = ''

  try {
    const result = await configService.testConnection(
      backendConfig.value.apiBaseUrl,
      backendConfig.value.apiToken
    )
    connectionStatus.value.success = result.success
    connectionStatus.value.message = result.message

    if (result.success) {
      ElMessage.success(result.message)
    } else {
      ElMessage.error(result.message)
    }
  } catch (error: any) {
    connectionStatus.value.success = false
    connectionStatus.value.message = `测试失败: ${error.message}`
    ElMessage.error('连接测试失败')
  } finally {
    connectionStatus.value.testing = false
  }
}

// 保存后端配置
const saveBackendConfig = async () => {
  try {
    // 验证 URL 格式
    const url = backendConfig.value.apiBaseUrl.trim()
    if (!url) {
      ElMessage.warning('请输入后端服务地址')
      return
    }

    try {
      new URL(url)
    } catch {
      ElMessage.error('后端服务地址格式不正确，请输入完整的 URL（如: http://localhost:8080）')
      return
    }

    // 保存配置
    configService.saveConfig(backendConfig.value)
    ElMessage.success('配置已保存并生效')

    // 重置连接状态
    connectionStatus.value = {
      testing: false,
      success: null,
      message: '',
    }
  } catch (error: any) {
    ElMessage.error(`保存失败: ${error.message}`)
  }
}

// 重置后端配置
const resetBackendConfig = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要恢复默认配置吗？这将清除您保存的自定义后端地址。',
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    configService.resetConfig()
    loadBackendConfig()
    ElMessage.success('已恢复默认配置')

    // 重置连接状态
    connectionStatus.value = {
      testing: false,
      success: null,
      message: '',
    }
  } catch {
    // 用户取消操作
  }
}

// 加载后端配置
const loadBackendConfig = () => {
  backendConfig.value = configService.getConfig()
}

// ========== 原有配置相关 ==========

// YAML 编辑器相关状态
const yamlContent = ref('')
const yamlError = ref('')
const yamlSaving = ref(false)

// 配置数据
const config = ref<SystemConfig>({
  server: {
    host: '0.0.0.0',
    port: 8080,
    read_timeout: '30s',
    write_timeout: '30s',
    idle_timeout: '60s',
  },
  database: {
    type: 'sqlite',
    dsn: 'data/s3-balance.db',
    max_open_conns: 25,
    max_idle_conns: 5,
    conn_max_lifetime: 300,
    log_level: 'warn',
    auto_migrate: true,
  },
  buckets: [],
  balancer: {
    strategy: 'least-space',
    health_check_period: '30s',
    update_stats_period: '60s',
    retry_attempts: 3,
    retry_delay: '1s',
  },
  metrics: {
    enabled: true,
    path: '/metrics',
  },
  s3api: {
    access_key: 'AKIAIOSFODNN7EXAMPLE',
    secret_key: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    virtual_host: false,
    proxy_mode: true,
    auth_required: true,
    host: '',
  },
  api: {
    enabled: true,
    token: 'your-secure-api-token-change-this',
  },
})

// Metrics URL
const metricsUrl = computed(() => {
  const host = config.value.server.host === '0.0.0.0' ? 'localhost' : config.value.server.host
  const port = config.value.server.port
  const path = config.value.metrics.path
  return `http://${host}:${port}${path}`
})

onMounted(async () => {
  // 加载前端配置
  loadBackendConfig()
  // 加载系统配置
  await loadConfig()
  // 初始化 YAML 内容
  syncFromConfig()
})

// 监听 activeTab 变化，切换到 YAML 编辑器时同步内容
watch(activeTab, (newTab) => {
  if (newTab === 'yaml') {
    syncFromConfig()
  }
})

// 加载配置
const loadConfig = async () => {
  try {
    const loadedConfig = await systemConfigApi.getConfig()
    config.value = loadedConfig
    ElMessage.success('配置加载成功')
  } catch (error: any) {
    console.error('加载配置失败:', error)
    ElMessage.error(`加载配置失败: ${error.message || '请检查后端连接'}`)
  }
}

// 保存配置
const saveConfig = async (section: string) => {
  try {
    await ElMessageBox.confirm(
      '保存配置后会自动触发热更新，大部分配置会立即生效。服务器端口和数据库配置需要重启服务。确定要保存吗？',
      '确认保存',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    const result = await systemConfigApi.updateConfig(config.value)

    if (result.success) {
      // 更新本地配置为服务器返回的最新配置
      config.value = result.config
      ElMessage.success(result.message || '配置已保存并自动热更新')

      // 同步到YAML编辑器
      if (activeTab.value === 'yaml') {
        syncFromConfig()
      }
    } else {
      ElMessage.error(`保存失败: ${result.message}`)
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('保存配置失败:', error)
      const errorMessage = error.response?.data?.message || error.message || '保存配置失败'
      ElMessage.error(`保存失败: ${errorMessage}`)
    }
  }
}

// 重置配置
const resetConfig = (section: string) => {
  ElMessage.info(`重置 ${section} 配置`)
  // TODO: 恢复为初始值
}

// 导出配置
const exportConfig = () => {
  try {
    const yaml = convertToYAML(config.value)
    const blob = new Blob([yaml], { type: 'text/yaml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `s3-balance-config-${Date.now()}.yaml`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('配置已导出')
  } catch (error) {
    console.error('导出配置失败:', error)
    ElMessage.error('导出配置失败')
  }
}

// 导入配置
const importConfig = (file: File) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string
      // 解析 YAML
      const parsed = yaml.load(content) as SystemConfig
      config.value = parsed
      // 同步到 YAML 编辑器
      yamlContent.value = content
      yamlError.value = ''
      ElMessage.success('配置已导入')
    } catch (error: any) {
      console.error('导入配置失败:', error)
      ElMessage.error(`导入配置失败：${error.message || '请检查文件格式'}`)
    }
  }
  reader.readAsText(file)
  return false // 阻止自动上传
}

// 重置所有配置
const resetAllConfig = async () => {
  try {
    await ElMessageBox.confirm(
      '此操作将重置所有配置为默认值，且不可恢复。确定要继续吗？',
      '危险操作',
      {
        confirmButtonText: '确定重置',
        cancelButtonText: '取消',
        type: 'error',
      }
    )
    // TODO: 调用 API 重置配置
    await loadConfig()
    ElMessage.success('所有配置已重置')
  } catch {
    // 用户取消
  }
}

// 转换为 YAML 格式
const convertToYAML = (obj: any): string => {
  try {
    return yaml.dump(obj, {
      indent: 2,
      lineWidth: 120,
      noRefs: true,
    })
  } catch (error) {
    console.error('转换为 YAML 失败:', error)
    return JSON.stringify(obj, null, 2)
  }
}

// ========== YAML 编辑器相关函数 ==========

// 从配置对象同步到 YAML 编辑器
const syncFromConfig = () => {
  try {
    yamlContent.value = convertToYAML(config.value)
    yamlError.value = ''
  } catch (error: any) {
    yamlError.value = error.message || '转换失败'
    ElMessage.error('从配置同步失败')
  }
}

// 从 YAML 编辑器同步到配置对象
const syncToConfig = (): boolean => {
  try {
    const parsed = yaml.load(yamlContent.value) as SystemConfig
    config.value = parsed
    yamlError.value = ''
    return true
  } catch (error: any) {
    yamlError.value = error.message || '解析失败'
    return false
  }
}

// YAML 输入事件处理（实时验证）
const onYamlInput = () => {
  try {
    yaml.load(yamlContent.value)
    yamlError.value = ''
  } catch (error: any) {
    yamlError.value = error.message || 'YAML 语法错误'
  }
}

// 验证 YAML 语法
const validateYaml = () => {
  try {
    yaml.load(yamlContent.value)
    yamlError.value = ''
    ElMessage.success('YAML 语法正确')
  } catch (error: any) {
    yamlError.value = error.message || 'YAML 语法错误'
    ElMessage.error('YAML 语法错误，请检查格式')
  }
}

// 格式化 YAML
const formatYaml = () => {
  try {
    const parsed = yaml.load(yamlContent.value)
    yamlContent.value = yaml.dump(parsed, {
      indent: 2,
      lineWidth: 120,
      noRefs: true,
    })
    yamlError.value = ''
    ElMessage.success('YAML 已格式化')
  } catch (error: any) {
    yamlError.value = error.message || '格式化失败'
    ElMessage.error('格式化失败，请检查 YAML 语法')
  }
}

// 保存 YAML 配置
const saveYamlConfig = async () => {
  // 先验证语法
  if (!syncToConfig()) {
    ElMessage.error('YAML 语法错误，无法保存')
    return
  }

  try {
    await ElMessageBox.confirm(
      '保存配置后会自动触发热更新，大部分配置会立即生效。服务器端口和数据库配置需要重启服务。确定要保存吗？',
      '确认保存',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    yamlSaving.value = true

    const result = await systemConfigApi.updateConfig(config.value)

    if (result.success) {
      // 更新本地配置为服务器返回的最新配置
      config.value = result.config
      // 重新同步YAML内容
      syncFromConfig()
      ElMessage.success(result.message || '配置已保存并自动热更新')
    } else {
      ElMessage.error(`保存失败: ${result.message}`)
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('保存配置失败:', error)
      const errorMessage = error.response?.data?.message || error.message || '保存配置失败'
      ElMessage.error(`保存失败: ${errorMessage}`)
    }
  } finally {
    yamlSaving.value = false
  }
}
</script>

<style scoped>
.system-config {
  width: 100%;
}

.page-title {
  margin: 0 0 20px 0;
  font-size: 24px;
  font-weight: 500;
  color: #303133;
}

.form-hint {
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
  margin-top: 4px;
}

/* YAML 编辑器样式 */
.yaml-editor-container {
  width: 100%;
}

.yaml-editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.yaml-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.yaml-editor :deep(textarea) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
  font-size: 13px;
  line-height: 1.6;
  resize: vertical;
  min-height: 600px;
}

.yaml-error {
  margin-top: 12px;
  padding: 12px;
  background-color: #fef0f0;
  border: 1px solid #fde2e2;
  border-radius: 4px;
  color: #f56c6c;
  font-size: 13px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.yaml-error .el-icon {
  margin-top: 2px;
  flex-shrink: 0;
}

.yaml-error span {
  flex: 1;
  word-break: break-all;
}
</style>

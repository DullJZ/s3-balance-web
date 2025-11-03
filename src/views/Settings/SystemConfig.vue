<template>
  <div class="system-config">
    <h1 class="page-title">系统配置</h1>

    <el-tabs v-model="activeTab" type="border-card">
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
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { SystemConfig } from '@/types/config'
import * as yaml from 'js-yaml'

const activeTab = ref('server')

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
  s3api: {
    access_key: 'AKIAIOSFODNN7EXAMPLE',
    secret_key: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    virtual_host: false,
    proxy_mode: true,
    auth_required: true,
    host: '',
  },
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
})

// Metrics URL
const metricsUrl = computed(() => {
  const host = config.value.server.host === '0.0.0.0' ? 'localhost' : config.value.server.host
  const port = config.value.server.port
  const path = config.value.metrics.path
  return `http://${host}:${port}${path}`
})

onMounted(async () => {
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
    // TODO: 从 API 获取真实配置
    ElMessage.success('配置加载成功')
  } catch (error) {
    console.error('加载配置失败:', error)
    ElMessage.error('加载配置失败')
  }
}

// 保存配置
const saveConfig = async (section: string) => {
  try {
    await ElMessageBox.confirm(
      '保存配置可能需要重启服务才能生效，确定要保存吗？',
      '确认保存',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    // TODO: 调用 API 保存配置
    ElMessage.success('配置已保存')
  } catch {
    // 用户取消
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
      '保存 YAML 配置可能需要重启服务才能生效，确定要保存吗？',
      '确认保存',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    yamlSaving.value = true

    // TODO: 调用 API 保存配置
    // await api.saveConfig(config.value)

    // 模拟保存延迟
    await new Promise((resolve) => setTimeout(resolve, 500))

    ElMessage.success('配置已保存')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('保存配置失败:', error)
      ElMessage.error('保存配置失败')
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

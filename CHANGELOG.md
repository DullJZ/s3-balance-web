# 更新日志

## [0.2.0] - 2025-11-03

### 新增功能

#### YAML 编辑器
- ✨ 在系统配置页面新增 **YAML 编辑** Tab
- ✨ 支持直接编辑完整的 YAML 配置文件
- ✨ 实时语法验证，错误提示
- ✨ YAML 格式化功能（2 空格缩进，120 字符行宽）
- ✨ 手动验证语法功能
- ✨ 从表单配置同步到 YAML 编辑器
- ✨ 从 YAML 编辑器同步到表单配置
- ✨ 导出 YAML 配置文件
- ✨ 支持导入 YAML 配置文件

#### 技术改进
- 📦 添加 `js-yaml` 库用于 YAML 解析和生成
- 📦 添加 `@types/js-yaml` 类型定义
- 🎨 优化 YAML 编辑器样式（等宽字体、语法高亮提示）
- 🎨 添加 YAML 语法状态指示器
- 📝 新增 YAML 编辑器使用指南文档

### 优化改进
- ✨ 导入配置功能现在支持解析 YAML 格式
- ✨ 导出配置功能使用真实的 YAML 格式而非 JSON
- 🎨 改进错误提示信息，更详细的语法错误说明

### 文档更新
- 📝 更新 README.md，添加 YAML 编辑器功能说明
- 📝 新增 `docs/yaml-editor-guide.md` 详细使用指南
- 📝 更新技术栈说明，添加 js-yaml

---

## [0.1.0] - 2025-11-03

### 首次发布

#### 核心功能
- ✨ 仪表盘：系统状态概览、关键指标展示
- ✨ 存储桶管理：桶列表、桶详情、健康监控
- ✨ 负载均衡：策略配置、负载分布可视化
- ✨ 统计监控：详细统计数据、趋势分析
- ✨ 系统配置：服务器、数据库、S3 API、监控指标配置
- ✨ 配置备份：导入导出配置文件

#### 技术架构
- 🏗️ Vue 3 + TypeScript + Vite 项目架构
- 🏗️ Element Plus UI 组件库集成
- 🏗️ ECharts 图表库集成
- 🏗️ Vue Router 路由配置
- 🏗️ Pinia 状态管理准备
- 🏗️ Axios HTTP 请求封装

#### 布局组件
- 🎨 MainLayout：主布局（侧边栏 + 顶栏 + 内容区）
- 🎨 Header：顶部导航栏
- 🎨 Sidebar：侧边栏菜单

#### 页面组件
- 📄 Dashboard：仪表盘
- 📄 BucketList：存储桶列表
- 📄 BucketDetail：存储桶详情
- 📄 BalancerConfig：负载均衡配置
- 📄 StatisticsView：统计监控
- 📄 SystemConfig：系统配置

#### 工具函数
- 🔧 formatBytes：字节格式化
- 🔧 formatDateTime：日期时间格式化
- 🔧 formatPercent：百分比格式化
- 🔧 formatNumber：数字千分位格式化
- 🔧 formatDuration：持续时间格式化

#### 类型定义
- 📘 BucketConfig：存储桶配置类型
- 📘 SystemConfig：系统配置类型
- 📘 MonthlyStatsResponse：统计数据类型

#### 文档
- 📝 完整的 README.md
- 📝 项目结构说明
- 📝 开发指南
- 📝 部署指南

---

## 图例说明

- ✨ 新增功能
- 🎨 样式优化
- 🐛 Bug 修复
- 📦 依赖更新
- 🏗️ 架构改进
- 🔧 工具函数
- 📘 类型定义
- 📄 页面组件
- 📝 文档更新
- ⚡ 性能优化
- 🔒 安全改进

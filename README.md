# S3 Balance 管理面板

S3 Balance 管理面板是一个基于 Vue 3 + TypeScript + Element Plus 开发的现代化 Web 管理界面，用于管理和监控 [S3 Balance](https://github.com/DullJZ/s3-balance) 负载均衡服务。

## 功能特性

### 核心功能

- **仪表盘**：系统状态概览、关键指标展示、实时监控
- **存储桶管理**：桶列表、桶详情、健康状态、配置管理
- **负载均衡**：策略配置、负载分布可视化、性能统计
- **统计监控**：详细统计数据、自定义查询、数据导出、趋势分析
- **系统配置**：服务参数、数据库、S3 API、监控指标配置
- **前端配置** ⭐️：灵活配置后端服务地址、连接测试、实时生效
- **YAML 编辑器**：直接编辑完整配置文件、实时语法验证、格式化支持

### 技术亮点

- **前后端分离** ⭐️：灵活配置后端地址，支持多环境部署
- **现代化技术栈**：Vue 3 Composition API + TypeScript
- **高性能构建**：Vite 5.x 开发服务器和构建工具
- **企业级 UI**：Element Plus 组件库，美观易用
- **数据可视化**：ECharts 图表库，丰富的图表类型
- **响应式设计**：适配桌面和移动设备
- **类型安全**：完整的 TypeScript 类型定义
- **优雅降级** ⭐️：后端不可用时自动使用 Mock 数据

## 技术栈

- **框架**：Vue 3.3+
- **语言**：TypeScript 5.x
- **构建工具**：Vite 5.x
- **路由**：Vue Router 4.x
- **状态管理**：Pinia 2.x
- **UI 组件库**：Element Plus 2.4+
- **图表库**：ECharts 5.4+
- **HTTP 客户端**：Axios 1.6+
- **YAML 解析**：js-yaml 4.1+

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 8.0.0

### 安装依赖

```bash
npm install
```

### 配置后端地址 ⭐️

**方式一：环境变量**（推荐开发环境）

创建 `.env.local` 文件：

```bash
# 管理 API 地址
VITE_API_BASE_URL=http://localhost:8082
```

**方式二：界面配置**（推荐生产环境）

1. 启动应用
2. 访问"系统配置"页面
3. 在前端配置部分输入后端地址并测试连接
4. 保存配置（配置保存在浏览器 localStorage）


### 配置部署路径 ⭐️

如果应用部署在子路径（如 `example.com/web/`），需要配置部署路径。

**方式一：修改 `.env.production`**

```bash
# 默认已配置为 /web/
VITE_BASE_PATH=/web/
```

**方式二：构建时指定**

```bash
# 部署在根路径
VITE_BASE_PATH=/ npm run build

# 部署在自定义子路径
VITE_BASE_PATH=/admin/ npm run build
```

**详细说明**：参考 [部署文档](./DEPLOY.md)

### 开发模式

```bash
# 启动开发服务器（默认端口 5173）
npm run dev
```

访问 http://localhost:5173 即可查看管理面板。

### 生产构建

```bash
# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

构建产物将输出到 `dist` 目录。


## 项目结构

```
src/
├── views/                    # 页面视图
│   ├── Dashboard.vue         # 仪表盘
│   ├── Bucket/               # 存储桶管理
│   │   ├── BucketList.vue    # 桶列表
│   │   └── BucketDetail.vue  # 桶详情
│   ├── Balancer/             # 负载均衡
│   │   └── BalancerConfig.vue
│   ├── Statistics/           # 统计监控
│   │   └── StatisticsView.vue
│   └── Settings/             # 系统配置
│       └── SystemConfig.vue
│
├── components/               # 通用组件
│   ├── layout/               # 布局组件
│   │   ├── Header.vue
│   │   ├── Sidebar.vue
│   │   └── MainLayout.vue
│   ├── charts/               # 图表组件（待扩展）
│   └── common/               # 通用组件（待扩展）
│
├── stores/                   # Pinia 状态管理（待实现）
│
├── services/                 # API 服务封装
│   ├── api.ts                # Axios 实例配置
│   └── stats.ts              # 统计相关 API
│
├── types/                    # TypeScript 类型定义
│   ├── bucket.ts             # 存储桶类型
│   ├── stats.ts              # 统计类型
│   └── config.ts             # 配置类型
│
├── utils/                    # 工具函数
│   └── format.ts             # 格式化工具
│
├── router/                   # 路由配置
│   └── index.ts
│
├── assets/                   # 静态资源
│   └── styles/               # 样式文件
│       └── main.css
│
├── App.vue                   # 根组件
└── main.ts                   # 入口文件
```

## 配置说明

### 后端地址配置 ⭐️

s3-balance-web 提供三种灵活的后端地址配置方式：

#### 1. 界面配置（推荐）

**优势**：可视化操作、实时测试、无需重启

**操作步骤**：
1. 访问"系统配置 > 前端配置"
2. 输入后端服务地址（如：`http://localhost:8080`）
3. 点击"测试连接"验证可用性
4. 点击"保存配置"立即生效

#### 2. 环境变量配置

创建 `.env.local` 文件（开发环境）：

```bash
# 后端服务地址
VITE_API_BASE_URL=http://localhost:8080

# 或使用局域网地址
# VITE_API_BASE_URL=http://192.168.1.100:8080
```

创建 `.env.production` 文件（生产环境）：

```bash
# 生产环境后端地址
VITE_API_BASE_URL=https://api.example.com

# 或使用相对路径（配合 Nginx 反向代理）
# VITE_API_BASE_URL=/
```

## 开发指南

### 代码规范

项目遵循以下代码规范：

- 使用 TypeScript 严格模式
- 使用 Vue 3 Composition API (`<script setup>`)
- 组件命名使用 PascalCase
- 文件命名使用 kebab-case
- 使用 ESLint + Prettier 进行代码格式化

### YAML 编辑器使用

系统配置页面提供了 YAML 编辑器功能，支持直接编辑完整的配置文件。

**主要功能**：
- ✅ 实时语法验证
- ✅ 自动格式化（2 空格缩进，120 字符行宽）
- ✅ 手动验证和错误提示
- ✅ 从表单配置同步
- ✅ 导出为 YAML 文件

详细使用指南请查看：[YAML 编辑器使用指南](./docs/yaml-editor-guide.md)

### 添加新页面

1. 在 `src/views/` 目录创建页面组件
2. 在 `src/router/index.ts` 添加路由配置
3. 在侧边栏菜单中显示（自动根据路由配置生成）

### 调用后端 API

1. 在 `src/types/` 定义 TypeScript 类型
2. 在 `src/services/` 创建 API 服务文件
3. 在组件中导入并使用

示例：

```typescript
// src/services/example.ts
import { request } from './api'

export const exampleApi = {
  getList(): Promise<any[]> {
    return request.get('/api/example/list')
  },
  create(data: any): Promise<any> {
    return request.post('/api/example', data)
  },
}

// 在组件中使用
import { exampleApi } from '@/services/example'

const loadData = async () => {
  const data = await exampleApi.getList()
  // ...
}
```

## 已知问题

- [ ] 部分管理接口需要后端扩展支持（存储桶配置管理、系统配置管理）
- [ ] 实时数据推送功能待实现（WebSocket）
- [ ] 数据导出功能待完善
- [ ] 部分页面使用模拟数据，需对接真实 API

## 后续规划

- [ ] 实现 Pinia 状态管理
- [ ] 添加用户认证和权限管理
- [ ] 实现 WebSocket 实时数据推送
- [ ] 添加更多图表组件和可视化功能
- [ ] 完善响应式布局，优化移动端体验
- [ ] 添加单元测试和 E2E 测试
- [ ] 国际化支持（i18n）
- [ ] 暗黑模式切换

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 相关项目

- [S3 Balance](https://github.com/DullJZ/s3-balance) - S3 兼容负载均衡服务

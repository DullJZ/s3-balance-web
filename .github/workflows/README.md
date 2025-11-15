# GitHub Actions 工作流说明

## 📋 可用工作流

### 1. Build and Release (`release.yml`)

自动构建前端并创建 GitHub Release，上传构建产物。

#### 触发方式

**方式一：手动触发（推荐）**

1. 进入仓库的 Actions 页面
2. 选择 "Build and Release" 工作流
3. 点击 "Run workflow" 按钮
4. 选择分支（通常是 `main`）
5. 点击绿色的 "Run workflow" 确认

**方式二：推送标签触发**

```bash
# 创建并推送标签
git tag v1.0.0
git push origin v1.0.0

# 或者创建带说明的标签
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

#### 工作流程

1. ✅ 检出代码
2. ✅ 设置 Node.js 环境（v20）
3. ✅ 安装依赖（`npm ci`）
4. ✅ 构建前端（`npm run build`）
5. ✅ 生成时间戳（格式：`YYYYMMDD-HHMMSS`）
6. ✅ 打包 dist 目录为 `.tar.gz` 和 `.zip`
7. ✅ 生成构建信息文件
8. ✅ ���建 GitHub Release（使用时间戳命名）
9. ✅ 上传构建产物到 Release

#### Release 命名规则

- **Release 名称**: `release-YYYYMMDD-HHMMSS`
- **Tag 名称**: `release-YYYYMMDD-HHMMSS`
- **示例**: `release-20250114-153045`

#### 构建产物

每次成功构建会生成 3 个文件：

1. **s3-balance-web-dist-{timestamp}.tar.gz**
   - Linux/Unix 系统推荐格式
   - 使用 `tar -xzf` 解压

2. **s3-balance-web-dist-{timestamp}.zip**
   - Windows 系统推荐格式
   - 使用 WinRAR/7-Zip 解压

3. **build-info.txt**
   - 构建信息文件
   - 包含构建时间、提交哈希、部署说明等

## 🔧 自定义配置

### 修改部署路径

如果需要修改默认的 `/web/` 部署路径，可以编辑工作流文件：

```yaml
- name: 构建前端
  run: npm run build
  env:
    VITE_BASE_PATH: /your-custom-path/  # 修改此处
```

### 修改 Node.js 版本

```yaml
- name: 设置 Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'  # 修改版本号
```

### 修改触发条件

#### 只在主分支推送时触发

```yaml
on:
  push:
    branches:
      - main
```

#### 在 Pull Request 合并时触发

```yaml
on:
  pull_request:
    branches:
      - main
    types: [closed]
```

## 📊 查看构建结果

### 方式一：Actions 页面

1. 进入仓库的 Actions 页面
2. 查看最近的工作流运行记录
3. 点击进入查看详细日志

### 方式二：Releases 页面

1. 进入仓库的 Releases 页面
2. 查看最新的 Release
3. 下载构建产物

## 🐛 故障排查

### 构建失败：依赖安装错误

**原因**: `package-lock.json` 与 `package.json` 不同步

**解决方案**:
```bash
# 本地重新生成 package-lock.json
rm package-lock.json
npm install
git add package-lock.json
git commit -m "chore: 更新 package-lock.json"
git push
```

### 构建失败：TypeScript 编译错误

**原因**: 代码存在类型错误

**解决方案**:
```bash
# 本地运行检查
npm run build

# 修复错误后提交
git add .
git commit -m "fix: 修复类型错误"
git push
```

### Release 创建失败：权限错误

**原因**: `GITHUB_TOKEN` 权限不足

**解决方案**:
1. 进入仓库 Settings > Actions > General
2. 滚动到 "Workflow permissions"
3. 选择 "Read and write permissions"
4. 保存设置并重新运行工作流

### 文件上传失败：���件过大

**原因**: GitHub Release 单个文件限制为 2GB

**解决方案**:
- 检查 dist 目录大小
- 考虑分割大文件或删除不必要的资源

## 💡 最佳实践

### 1. 使用语义化版本标签

虽然工作流使用时间戳命名，但建议同时推送语义化版本标签：

```bash
# 主要版本更新
git tag v1.0.0

# 次要版本更新
git tag v1.1.0

# 补丁版本更新
git tag v1.1.1
```

### 2. 定期清理旧 Release

建议保留最近 5-10 个 Release，删除过时的版本：

1. 进入 Releases 页面
2. 点击旧版本的 Release
3. 点击 "Delete" 删除

### 3. 在 Release 中添加更新说明

手动编辑 Release 说明，添加：
- 新增功能
- Bug 修复
- 破坏性变更
- 迁移指南

## 🔗 相关文档

- [GitHub Actions 官方文档](https://docs.github.com/en/actions)
- [项目部署文档](../../DEPLOY.md)
- [项目 README](../../README.md)

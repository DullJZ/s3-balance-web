# 部署指南

## 配置部署路径

本应用支持部署在任意路径下，通过环境变量 `VITE_BASE_PATH` 配置。

### 快速配置

**方法 1：修改 `.env.production` 文件**

```bash
# 编辑 .env.production
VITE_BASE_PATH=/web/
```

**方法 2：创建 `.env.production.local` 文件（推荐）**

```bash
# 创建 .env.production.local（此文件不会被 git 跟踪）
echo "VITE_BASE_PATH=/your-path/" > .env.production.local
```

**方法 3：构建时直接指定**

```bash
VITE_BASE_PATH=/admin/ npm run build
```

### 常见部署场景

#### 1. 部署在根路径（`example.com/`）

```bash
VITE_BASE_PATH=/ npm run build
```

#### 2. 部署在子路径（`example.com/web/`）

```bash
VITE_BASE_PATH=/web/ npm run build
```

#### 3. 部署在多级子路径（`example.com/admin/dashboard/`）

```bash
VITE_BASE_PATH=/admin/dashboard/ npm run build
```

### 重要提示

⚠️ **路径格式要求**：
- 必须以 `/` 开头
- 必须以 `/` 结尾
- 示例：`/web/` ✅ | `/web` ❌ | `web/` ❌

## Nginx 配置示例

### 部署在 `/web/` 路径

```nginx
server {
    listen 80;
    server_name example.com;

    # 前端静态文件
    location /web/ {
        alias /var/www/s3-balance-web/dist/;
        try_files $uri $uri/ /web/index.html;

        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # 后端 API 代理（可选）
    location /api/ {
        proxy_pass http://localhost:8082/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 部署在根路径 `/`

```nginx
server {
    listen 80;
    server_name example.com;

    root /var/www/s3-balance-web/dist;
    index index.html;

    # 前端路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 缓存静态资源
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://localhost:8082/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 验证部署

构建完成后，检查 `dist/index.html`：

```html
<!-- 正确的路径示例 -->
<script src="/web/assets/index-xxx.js"></script>
<link href="/web/assets/index-xxx.css">
```

部署后访问应用：
1. 打开浏览器开发者工具（F12）
2. 切换到 Network 标签
3. 刷新页面
4. 检查所有 JS/CSS 资源是否返回 200 状态码
5. 如果出现 404，检查 `VITE_BASE_PATH` 是否与 Nginx 配置一致

## 故障排查

### 问题：资源 404 错误

**症状**：访问 `example.com/web/` 时，浏览器请求 `example.com/assets/index.js` 而不是 `example.com/web/assets/index.js`

**原因**：`VITE_BASE_PATH` 配置不正确

**解决方案**：
1. 检查 `.env.production` 或 `.env.production.local` 中的 `VITE_BASE_PATH` 是否正确
2. 确保路径以 `/` 开头和结尾
3. 重新构建：`npm run build`
4. 验证 `dist/index.html` 中的路径是否正确

### 问题：路由切换后页面 404

**症状**：直接访问 `example.com/web/dashboard` 返回 404

**原因**：Nginx 未配置 SPA 路由回退

**解决方案**：
在 Nginx 配置中添加 `try_files $uri $uri/ /web/index.html;`

### 问题：开发环境正常，生产环境 404

**原因**：开发环境和生产环境的 base path 配置不一致

**说明**：
- 开发环境：默认使用 `/` 根路径
- 生产环境：使用 `VITE_BASE_PATH` 配置的路径

**解决方案**：
确保生产环境的 Nginx 配置与 `VITE_BASE_PATH` 一致

## 默认配置

如果不创建自定义配置文件，应用使用以下默认值：

- **开发环境**（`npm run dev`）：`base: '/'`
- **生产环境**（`npm run build`）：`base: '/web/'`（来自 `.env.production`）

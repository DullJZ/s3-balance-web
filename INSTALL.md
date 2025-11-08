# 安装说明

## 安装依赖

本项目添加了 YAML 编辑器语法高亮功能，需要安装以下依赖：

```bash
npm install codemirror @codemirror/lang-yaml @codemirror/theme-one-dark
```

## 完整安装流程

```bash
# 1. 安装所有依赖
npm install

# 2. 启动开发服务器
npm run dev

# 3. 构建生产版本
npm run build
```

## 依赖说明

- **codemirror**: 现代化的代码编辑器核心库
- **@codemirror/lang-yaml**: YAML 语法支持
- **@codemirror/theme-one-dark**: 暗色主题

## 故障排除

如果遇到 npm 权限错误，请运行：

```bash
sudo chown -R $(whoami) ~/.npm
```

然后重新安装依赖。

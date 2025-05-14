# SaaS MIS 开发环境设置指南

本文档提供了设置和运行 SaaS MIS 开发环境的详细步骤。

## 前提条件

- Node.js v18.x+ 或 v20.9.0+
- Docker 和 Docker Compose v2
- 编辑器（推荐 Visual Studio Code）
- Git

## 本地开发设置

1. **克隆仓库**

```bash
git clone <repository-url>
cd saas-mis
```

2. **安装依赖**

```bash
pnpm install
```

3. **配置环境变量**

复制环境变量模板文件并根据需要修改：

```bash
cp env.development.sample .env.development
```

主要的环境变量包括：
- `VITE_SUPABASE_URL`: Supabase 项目 URL
- `VITE_SUPABASE_ANON_KEY`: Supabase 匿名密钥
- `VITE_APP_TITLE`: 应用标题
- `VITE_APP_ENV`: 环境类型

4. **启动开发服务器**

```bash
pnpm dev
```

访问 http://localhost:8848 查看应用。

## Docker 开发环境

1. **构建 Docker 镜像并启动容器**

```bash
docker compose up --build
```

访问 http://localhost:8848 查看应用。

2. **使用 Docker 运行命令**

添加依赖包：
```bash
docker compose run --rm npm install <package-name>
```

运行 lint:
```bash
docker compose run --rm npm run lint
```

3. **查看应用日志**

```bash
docker compose logs -f app
```

## 验证开发环境

### 验证 TypeScript 编译

```bash
pnpm run typecheck
```

### 验证 ESLint

```bash
pnpm run lint:eslint
```

### 验证 Prettier 格式化

```bash
pnpm run lint:prettier
```

## 常见问题

### 热更新不工作

- 确保在 Docker 配置中启用了 `CHOKIDAR_USEPOLLING`
- 检查 `vite.config.ts` 中的 HMR 配置是否正确

### 环境变量未加载

- 检查环境变量文件名是否正确 (`.env.development`)
- 确保所有 `VITE_` 前缀的变量名拼写正确

## 参考资源

- [Pure Admin 文档](https://github.com/pure-admin/vue-pure-admin)
- [Vite 官方文档](https://vitejs.dev/)
- [Supabase 文档](https://supabase.io/docs)
- [Vue 3 文档](https://vuejs.org/) 
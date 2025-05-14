# 开发环境配置指南

## 1. 环境准备

### 1.1 基础环境要求
- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Git >= 2.0.0
- Docker >= 24.0.0
- Docker Compose >= 2.0.0

### 1.2 开发工具配置
- VS Code 推荐插件：
  - Volar (Vue 3 支持)
  - TypeScript Vue Plugin
  - ESLint
  - Prettier
  - GitLens
  - Error Lens
  - Docker
  - Remote - Containers

## 2. 项目初始化

### 2.1 克隆项目
```bash
# 克隆项目
git clone [项目地址]

# 进入项目目录
cd saas-mis
```

### 2.2 使用 Docker 开发环境
如果使用 Docker 作为开发环境，则无需手动安装依赖，直接执行以下命令启动开发容器：

## 3. Docker 开发环境

### 3.1 配置文件准备
1. 创建 `Dockerfile.dev`：
   ```dockerfile
   # Dockerfile.dev
   FROM node:18-alpine

   # 安装 pnpm
   RUN npm install -g pnpm

   # 设置工作目录
   WORKDIR /app

   # 复制 package.json 和 pnpm-lock.yaml
   COPY package.json pnpm-lock.yaml ./

   # 安装依赖
   RUN pnpm install

   # 复制项目文件
   COPY . .

   # 暴露端口
   EXPOSE 3000

   # 设置环境变量
   ENV CHOKIDAR_USEPOLLING=true
   ENV WATCHPACK_POLLING=true

   # 启动开发服务器
   CMD ["pnpm", "dev"]
   ```

2. 创建 `docker-compose.yml`：
   ```yaml
   version: '3.8'
   services:
     app:
       build:
         context: .
         dockerfile: Dockerfile.dev
       volumes:
         - .:/app
         - /app/node_modules
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=development
         - VITE_HMR_HOST=localhost
         - VITE_HMR_PORT=3000
         - CHOKIDAR_USEPOLLING=true
       command: pnpm dev
   ```

### 3.2 启动开发环境
1. 构建开发环境镜像：
   ```bash
   # 构建开发环境镜像
   docker build -t saas-mis-dev -f Dockerfile.dev .
   ```

2. 启动开发容器：
   ```bash
   # 使用 docker-compose 启动开发环境
   docker-compose up -d
   ```

### 3.3 开发环境使用
1. 查看日志：
   ```bash
   # 查看容器日志
   docker-compose logs -f
   ```

2. 进入容器：
   ```bash
   # 进入容器终端
   docker-compose exec app sh
   ```

3. 停止环境：
   ```bash
   # 停止并移除容器
   docker-compose down
   ```

## 4. 开发调试

### 4.1 浏览器调试
- 安装 Vue Devtools 浏览器插件
- 启用 Chrome DevTools 的 Vue 调试功能
- 使用 Vue Devtools 进行组件调试

### 4.2 代码调试
- 使用 console.log 进行基础调试
- 使用 Vue Devtools 进行组件状态调试
- 使用 Chrome DevTools 的 Sources 面板进行断点调试

## 5. 环境变量配置

### 5.1 开发环境配置
创建 `.env.development` 文件：
```env
VITE_APP_TITLE=开发环境
VITE_APP_API_URL=http://localhost:54321
VITE_APP_SUPABASE_URL=your-supabase-url
VITE_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 6. 常见问题解决

### 6.1 前端问题
- 依赖安装失败：清除 pnpm store 后重试
- 编译错误：检查 TypeScript 类型定义
- 热更新失效：重启开发服务器

### 6.2 Docker 问题
- 容器启动失败：检查端口占用
- 热更新不生效：检查环境变量配置
- 依赖安装失败：检查网络连接

## 7. 开发工作流

### 7.1 代码提交规范
- 使用 Conventional Commits 规范
- 提交前运行 lint 和测试
- 保持提交信息清晰明确

### 7.2 分支管理
- main：主分支
- develop：开发分支
- feature/*：功能分支
- bugfix/*：修复分支

### 7.3 开发流程
1. 创建功能分支
2. 开发功能
3. 提交代码
4. 创建 Pull Request
5. 代码审查
6. 合并到开发分支

## 后端开发环境

### 1. Supabase 配置
1. 创建 Supabase 项目
   - 访问 [Supabase Dashboard](https://app.supabase.com)
   - 创建新项目
   - 记录项目 URL 和 anon key

2. 本地开发设置
   - 安装 Supabase CLI
   ```bash
   npm install -g supabase
   ```
   
   - 初始化 Supabase 项目
   ```bash
   supabase init
   ```

### 2. 数据库配置
1. 创建数据库迁移
   ```bash
   supabase migration new initial_schema
   ```

2. 编写数据库迁移文件
   - 创建租户表
   - 创建用户表
   - 设置 RLS 策略

### 3. 认证配置
1. 配置认证提供商
   - 启用邮箱认证
   - 配置 JWT 设置
   - 设置认证回调 URL

2. 设置安全规则
   - 配置 CORS 策略
   - 设置 API 访问限制
   - 配置安全头部

## 下一步
1. 完成环境配置后，开始实现基础组件
2. 设置数据库模型和关系
3. 实现用户认证流程 
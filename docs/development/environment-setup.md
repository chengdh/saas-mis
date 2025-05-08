# 开发环境配置指南

## 前端开发环境

### 1. 基础环境要求
- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Git >= 2.0.0

### 2. 开发工具配置
- VS Code 推荐插件：
  - Volar (Vue 3 支持)
  - TypeScript Vue Plugin
  - ESLint
  - Prettier
  - GitLens
  - Error Lens

### 3. 项目初始化
```bash
# 克隆项目
git clone [项目地址]

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

### 4. 开发调试配置
1. 浏览器调试
   - 安装 Vue Devtools 浏览器插件
   - 启用 Chrome DevTools 的 Vue 调试功能
   - 使用 Vue Devtools 进行组件调试

2. 代码调试
   - 使用 console.log 进行基础调试
   - 使用 Vue Devtools 进行组件状态调试
   - 使用 Chrome DevTools 的 Sources 面板进行断点调试

### 5. 环境变量配置
创建 `.env.development` 文件：
```env
VITE_APP_TITLE=开发环境
VITE_APP_API_URL=http://localhost:54321
VITE_APP_SUPABASE_URL=your-supabase-url
VITE_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
```

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

## 开发工作流

### 1. 代码提交规范
- 使用 Conventional Commits 规范
- 提交前运行 lint 和测试
- 保持提交信息清晰明确

### 2. 分支管理
- main：主分支
- develop：开发分支
- feature/*：功能分支
- bugfix/*：修复分支

### 3. 开发流程
1. 创建功能分支
2. 开发功能
3. 提交代码
4. 创建 Pull Request
5. 代码审查
6. 合并到开发分支

## 常见问题解决

### 1. 前端问题
- 依赖安装失败：清除 pnpm store 后重试
- 编译错误：检查 TypeScript 类型定义
- 热更新失效：重启开发服务器

### 2. 后端问题
- Supabase 连接失败：检查环境变量
- 数据库迁移错误：检查 SQL 语法
- 认证问题：检查 JWT 配置

## 下一步
1. 完成环境配置后，开始实现基础组件
2. 设置数据库模型和关系
3. 实现用户认证流程 
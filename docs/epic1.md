# Epic 1: 系统基础架构

**Goal:** 建立健壮的多租户系统基础架构，基于Pure Admin精简版模板，实现核心的用户认证、授权和租户数据隔离机制，为后续功能模块的开发奠定基础。

**Deployability:** 这是第一个 Epic，将基于Pure Admin精简版模板创建项目的初始脚手架，配置核心服务（认证、数据库），并部署一个最小化的、能够验证多租户隔离和基础认证功能的应用框架。后续所有 Epic 都将在此基础上构建。

## Epic-Specific Technical Context

- **项目脚手架:** 基于 **Pure Admin 精简版 (Thin)** 模板初始化Vue3 + TypeScript前端项目。使用其内置的 **Element Plus** UI库。配置Supabase后端项目。
- **基础设施设置:** 配置Supabase数据库模式以支持多租户（例如，通过行级安全策略RLS）。配置Supabase Auth以处理用户注册和登录。
- **核心服务:** 集成Supabase Auth、数据库服务。
- **环境变量:** 设置用于连接Supabase实例和其他必要服务的环境变量（可能需要适配Pure Admin的配置方式）。
- **依赖管理:** 基于Pure Admin模板的`package.json`进行依赖管理，并添加Supabase客户端库等必要依赖。

## Local Testability & Command-Line Access

- **Local Development:**
  - 遵循Pure Admin的开发文档和脚本，在本地启动前端并连接到Supabase开发实例。
  - 模拟Supabase服务（如果可行）以支持离线开发。
- **Command-Line Testing:**
  - 提供脚本用于初始化本地数据库模式。
  - 提供脚本用于创建测试租户和用户。
  - 利用Pure Admin集成的测试工具运行单元测试和集成测试。
- **Environment Testing:**
  - 确保开发、测试和生产环境配置隔离且易于切换（适配Pure Admin的环境变量管理）。
  - 提供在不同环境中执行测试的方法。
- **Testing Prerequisites:**
  - 需要有效的Supabase项目凭证（开发/测试环境）。
  - 需要安装Node.js、npm/yarn等开发工具（根据Pure Admin要求）。

## Story List

### Story 1.1: 开发环境搭建与配置

- **User Story / Goal:** 作为开发团队，我需要搭建一个完整的开发环境，包括前端项目初始化、Docker环境配置和必要的开发工具设置，以便团队能够高效地进行开发工作。

- **Technical Prerequisites:**
  - Node.js >= 18.0.0
  - npm >= 9.0.0
  - Docker >= 24.0.0
  - Docker Compose >= 2.0.0
  - Git >= 2.0.0

- **Detailed Requirements:**
  1. **项目初始化**
     - 使用Pure Admin精简版模板创建项目
     - 选择TypeScript + Vue3技术栈
     - 配置项目名称为"saas-mis"
     - 确保项目结构符合Pure Admin最佳实践

  2. **Supabase集成**
     - 安装并配置Supabase客户端库（@supabase/supabase-js）
     - 配置Supabase连接参数
     - 实现Supabase客户端单例模式
     - 添加Supabase类型定义

  3. **环境配置**
     - 创建以下环境配置文件：
       ```
       .env.development    # 开发环境
       .env.test          # 测试环境
       .env.production    # 生产环境
       ```
     - 配置必要的环境变量：
       ```
       VITE_SUPABASE_URL=your-project-url
       VITE_SUPABASE_ANON_KEY=your-anon-key
       VITE_APP_TITLE=SaaS MIS
       VITE_APP_ENV=development
       ```

  4. **Pure Admin配置调整**
     - 配置路由模式为history
     - 设置默认主题为light
     - 配置国际化支持（中文简体）
     - 调整布局配置以适应多租户系统需求

  5. **开发工具配置**
     - 配置ESLint规则
     - 配置Prettier格式化规则
     - 配置TypeScript编译选项
     - 配置Vite构建选项

  6. **Docker开发环境**
     - 创建Dockerfile用于开发环境：
       ```dockerfile
       FROM node:18-alpine
       WORKDIR /app
       COPY package*.json ./
       RUN npm install
       COPY . .
       EXPOSE 3000
       ENV CHOKIDAR_USEPOLLING=true
       ENV WATCHPACK_POLLING=true
       CMD ["npm", "run", "dev"]
       ```
     - 创建docker-compose.yml：
       ```yaml
       version: '3.8'
       services:
         app:
           build: .
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
       ```
     - 配置开发环境热更新：
       - 在 vite.config.ts 中配置 HMR：
         ```typescript
         export default defineConfig({
           server: {
             host: '0.0.0.0',
             port: 3000,
             watch: {
               usePolling: true,
               interval: 1000
             },
             hmr: {
               host: 'localhost',
               port: 3000,
               protocol: 'ws'
             }
           }
         })
         ```
     - 配置开发环境调试工具：
       1. 配置源码映射：
          - 在 vite.config.ts 中启用 sourcemap：
            ```typescript
            export default defineConfig({
              build: {
                sourcemap: true
              }
            })
            ```
          - 确保 TypeScript 配置中启用 sourcemap：
            ```json
            // tsconfig.json
            {
              "compilerOptions": {
                "sourceMap": true
              }
            }
            ```

       2. 配置浏览器调试：
          - 安装 Chrome DevTools
          - 安装 Vue.js devtools 浏览器扩展
          - 在开发环境中启用 Vue 性能分析：
            ```typescript
            // main.ts
            if (process.env.NODE_ENV === 'development') {
              app.config.performance = true
            }
            ```

- **Acceptance Criteria (ACs):**
  1. **项目初始化验证**
     - AC1.1: 项目可以使用`npm run dev`成功启动
     - AC1.2: 项目结构符合Pure Admin规范
     - AC1.3: TypeScript编译无错误

  2. **Supabase连接验证**
     - AC2.1: 可以成功连接到Supabase实例
     - AC2.2: 可以执行基本的数据库操作
     - AC2.3: 类型定义正确且完整

  3. **环境配置验证**
     - AC3.1: 所有环境变量正确加载
     - AC3.2: 不同环境配置正确切换
     - AC3.3: 敏感信息得到适当保护

  4. **开发工具验证**
     - AC4.1: ESLint规则生效
     - AC4.2: Prettier格式化生效
     - AC4.3: 代码提交前检查通过

  5. **Docker环境验证**
     - AC5.1: 可以使用`docker-compose up`启动开发环境
     - AC5.2: 开发环境支持热更新
     - AC5.3: 开发环境支持调试
     - AC5.4: 容器日志正确输出

- **Documentation Requirements:**
  1. 项目初始化文档
  2. 环境配置指南
  3. 开发环境搭建文档
  4. Docker环境使用说明

- **Dependencies:** 无

---

### Story 1.2: 租户隔离数据库模式设计与实现

- **User Story / Goal:** 作为系统架构师，我需要设计并实现数据库模式，确保每个租户的数据通过Supabase RLS严格隔离。
- **Detailed Requirements:**
  - 设计核心表结构，包含`tenant_id`列。
  - 创建Supabase RLS策略，限制用户只能访问其所属租户的数据。
  - 实现获取当前用户租户信息的机制（例如，通过JWT）。
  - 编写数据库迁移脚本。
- **Acceptance Criteria (ACs):**
  - AC1: 创建的RLS策略能有效阻止用户A访问用户B（不同租户）的数据。
  - AC2: 超级管理员可以访问所有租户的数据（如有需要）。
  - AC3: 数据库迁移脚本可以成功执行并创建必要的表和策略。
- **Dependencies:** Story 1.1

---

### Story 1.3: 用户认证（注册与登录）

- **User Story / Goal:** 作为用户，我需要能够通过Pure Admin提供的界面进行注册和登录，并集成Supabase Auth进行验证，以便访问属于我企业的功能。
- **Detailed Requirements:**
  - 利用Pure Admin的登录/注册页面组件作为基础。
  - 集成Supabase Auth的`signUp`方法到注册流程。
  - 集成Supabase Auth的`signInWithPassword`方法到登录流程。
  - 登录成功后，获取Supabase的session/JWT，并适配Pure Admin的认证状态管理（如Pinia store）。
  - 处理常见的认证错误并在Pure Admin的界面上显示。
- **Acceptance Criteria (ACs):**
  - AC1: 新用户可以使用Pure Admin注册页通过Supabase Auth成功注册。
  - AC2: 已注册用户可以使用Pure Admin登录页通过Supabase Auth成功登录。
  - AC3: 登录失败时在Pure Admin界面显示合适的错误信息。
  - AC4: 登录成功后，前端能获取到Supabase认证令牌，并且Pure Admin的认证状态正确更新。
- **Dependencies:** Story 1.1, Story 1.2 (Docker环境需可用)

---

### Story 1.4: 基础角色与权限管理框架

- **User Story / Goal:** 作为系统管理员，我需要一个基础的角色定义和权限检查机制，并能与Pure Admin的路由权限控制相结合，以便为后续功能模块的访问控制打下基础。
- **Detailed Requirements:**
  - 设计基础的角色表（如`roles`）和用户角色关联表（如`user_roles`）于Supabase。
  - 定义初始的核心角色（例如，`admin`, `member`）。
  - 实现将角色信息嵌入到Supabase用户认证令牌（JWT）或通过查询获取的机制。
  - **适配Pure Admin的权限控制:** 将从Supabase获取的角色信息与Pure Admin的路由元信息（meta.roles）或权限指令相结合，实现前端路由和按钮级别的权限控制。
  - 创建一个基础的后端权限检查函数或中间件（如有需要，例如在Supabase Edge Functions中）。
- **Acceptance Criteria (ACs):**
  - AC1: 数据库中可以存储用户及其对应的角色。
  - AC2: 登录用户的角色信息能够被前端获取。
  - AC3: Pure Admin的路由守卫能够根据用户角色正确控制页面访问。
  - AC4: （可选）Pure Admin的权限指令能够根据用户角色控制按钮显隐。
- **Dependencies:** Story 1.2, Story 1.3

## Change Log

| Change | Date | Version | Description | Author |
| ------ | ---- | ------- | ----------- | ------ |
| 合并Story 1.1和1.2 | 2024-03-21 | 1.4 | 合并开发环境搭建相关的Story | PM |
| 添加Docker故事 | 2024-03-21 | 1.3 | 增加了使用Docker构建开发环境的用户故事 | PM |
| 术语调整 | 2024-03-21 | 1.2 | 将"史诗"替换为"Epic" | PM |
| 调整技术选型 | 2024-03-21 | 1.1 | 更新为使用Pure Admin精简版 | PM |
| 初始版本 | 2024-03-21 | 1.0 | 创建Epic 1文档 | PM | 
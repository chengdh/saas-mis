# 项目结构文档 (Project Structure)

## 1. 简介

本文档定义了企业级SaaS管理信息系统平台的项目目录结构。一个清晰、一致且组织良好的项目结构对于团队协作、代码可维护性、可扩展性以及AI代理辅助开发至关重要。本项目结构基于Pure Admin精简版模板的约定，并针对SaaS应用的特性和Supabase后端进行了适配。

## 2. 总体原则

- **约定优于配置:** 尽可能遵循Pure Admin、Vue、Vite和TypeScript的社区标准和最佳实践。
- **模块化:** 按功能模块组织代码，确保高内聚、低耦合。
- **职责分离:** 清晰区分展示层、业务逻辑层、服务层和API交互层。
- **可发现性:** 目录和文件名应具有描述性，易于查找和理解。
- **AI友好:** 结构应简洁明了，避免不必要的嵌套深度，方便AI代理理解和操作代码。
- **配置集中:** 环境配置、API密钥等应集中管理，不散落在代码各处。

## 3. 根目录结构 (Frontend - Pure Admin Based)

```
.github/workflows/         # CI/CD 配置文件 (e.g., GitHub Actions)
.husky/                    # Git 钩子配置 (e.g., pre-commit)
.vscode/                   # VSCode 编辑器配置 (settings.json, extensions.json)
build/                     # Vite 构建相关配置脚本 (Pure Admin 提供)
dist/                      # 项目打包后的输出目录 (由 Vite 生成)
docs/                      # 项目文档 (架构、API、规范等，本文档所在目录)
  ├── architecture.md
  ├── tech-stack.md
  ├── project-structure.md   # 本文档
  ├── coding-standards.md
  ├── api-reference.md
  ├── data-models.md
  ├── environment-vars.md
  ├── testing-strategy.md
  ├── frontend-architecture.md
  ├── prd.md
  ├── epicN.md
  └── ...                  # 其他相关文档
public/
  ├── favicon.ico
  ├── ...                  # 静态资源，不会被Vite处理，直接拷贝到dist目录
src/
  ├── App.vue              # Vue 应用根组件
  ├── main.ts              # 应用入口文件 (初始化 Vue, Pinia, Router 等)
  ├── api/                 # API 请求模块 (按业务模块划分)
  │   ├── auth.ts          # 认证相关API
  │   ├── tenant.ts        # 租户管理API
  │   ├── news.ts          # 新闻管理API
  │   ├── hr/              # 人力资源模块API
  │   │   └── employee.ts
  │   └── ...              # 其他业务模块API
  ├── assets/              # 静态资源 (会被Vite处理，如图片, 字体, 全局CSS)
  │   ├── icons/           # SVG 图标
  │   ├── images/          # 图片资源
  │   └── styles/          # 全局样式 (variables.scss, mixins.scss)
  ├── components/          # 全局通用组件 (可复用)
  │   ├── Business/        # 业务通用组件 (与特定业务相关但可跨页面复用)
  │   ├── Common/          # 纯UI或基础功能组件 (与业务无关)
  │   └── Layout/          # 布局相关组件 (Pure Admin 提供或自定义)
  ├── config/              # 应用配置
  │   ├── index.ts         # 全局配置 (如应用标题、默认设置)
  │   └── theme.ts         # 主题配置 (Pure Admin)
  ├── directives/          # Vue 自定义指令
  ├── enums/               # 枚举定义
  │   ├── common.ts        # 通用枚举
  │   └── modules/         # 按模块划分的业务枚举
  ├── hooks/               # Vue Composition API Hooks (可复用逻辑)
  ├── layouts/             # 页面布局组件 (Pure Admin 提供或自定义)
  │   └── default/         # 默认布局
  ├── locales/             # 国际化语言包 (Pure Admin i18n)
  │   ├── lang/
  │   │   ├── en.ts
  │   │   └── zh-CN.ts
  │   └── index.ts
  ├── mock/                # Mock 数据 (Pure Admin 提供，用于本地开发)
  ├── plugins/             # Vue 插件
  ├── router/              # Vue Router 配置
  │   ├── index.ts         # 路由主配置文件
  │   ├── modules/         # 按业务模块拆分的路由配置
  │   └── guard.ts         # 路由守卫
  ├── store/               # Pinia 状态管理
  │   ├── index.ts         # Pinia 实例创建和导出
  │   ├── modules/         # 按业务模块拆分的Store
  │   │   ├── user.ts      # 用户信息、认证状态
  │   │   ├── app.ts       # 应用全局状态 (Pure Admin)
  │   │   ├── permission.ts # 权限状态 (Pure Admin)
  │   │   └── settings.ts   # 系统设置状态 (Pure Admin)
  │   └── getters.ts       # 全局Getters (如果需要)
  ├── styles/              # 全局及组件级别样式 (Pure Admin 结构)
  │   ├── element/
  │   ├── index.scss
  │   └── reset.scss
  ├── types/               # TypeScript 类型定义
  │   ├── global.d.ts      # 全局类型声明
  │   ├── auto-imports.d.ts # Vite插件自动生成
  │   ├── components.d.ts  # Vite插件自动生成
  │   ├──shims-vue.d.ts   # Vue 文件类型声明
  │   ├── api/             # API相关的请求参数和响应数据类型
  │   │   ├── auth.d.ts
  │   │   └── ...
  │   └── models/          # 业务模型类型 (与后端数据结构对应)
  │       ├── tenant.d.ts
  │       └── ...
  ├── utils/               # 工具函数模块
  │   ├── auth.ts          # 认证相关工具 (如Token处理)
  │   ├── request.ts       # HTTP 请求封装 (基于Supabase JS Client 或 Axios)
  │   ├── index.ts         # 通用工具函数
  │   └── ...              # 其他工具函数
  └── views/               # 页面组件 (按业务模块划分)
      ├── system/
      │   ├── login/         # 登录页
      │   ├── register/      # 注册页 (如果前端处理)
      │   ├── 403.vue
      │   ├── 404.vue
      │   └── ...
      ├── dashboard/         # 控制台/首页
      │   └── index.vue
      ├── enterprise/        # 企业管理模块页面
      │   ├── profile/       # 企业信息
      │   └── users/         # 企业用户管理
      ├── news/
      │   ├── list.vue
      │   └── edit.vue
      ├── hr/
      │   ├── employee/
      │   │   ├── list.vue
      │   │   └── detail.vue
      │   └── department.vue
      ├── kpi/
      └── workflow/
.env                       # Vite 环境变量 (通用，不提交到Git)
.env.development           # 开发环境变量
.env.production            # 生产环境变量
.env.test                  # 测试环境变量
.eslintignore
.eslintrc.cjs              # ESLint 配置文件
.gitattributes
.gitignore                 # Git 忽略文件配置
.prettierignore
.prettierrc.cjs            # Prettier 配置文件
CHANGELOG.md
CODE_OF_CONDUCT.md
CONTRIBUTING.md
Dockerfile                 # Docker 配置文件 (来自 epic1.md)
docker-compose.yml         # Docker Compose 配置文件 (来自 epic1.md)
LICENSE
README.md                  # 项目说明文档
index.html                 # Vite 入口 HTML 文件
package.json               # 项目依赖和脚本配置
postcss.config.cjs
stylelint.config.cjs       # Stylelint 配置文件
tsconfig.json              # TypeScript 编译器配置
tsconfig.node.json         # TypeScript 针对 Node 环境的配置 (Vite)
vite.config.ts             # Vite 配置文件
```

## 4. Supabase 相关目录 (通常在 Supabase 项目内管理)

Supabase 的后端资源（数据库模式、Edge Functions、RLS策略、存储桶配置等）通常在其自身的平台或通过Supabase CLI进行管理。当使用Supabase CLI进行本地开发和迁移时，可能会有以下结构 (通常独立于前端项目，或作为前端项目的子目录 `supabase/`):

```
supabase/
  ├── migrations/            # 数据库迁移脚本 (SQL 文件)
  │   └── YYYYMMDDHHMMSS_migration_name.sql
  ├── functions/             # Supabase Edge Functions
  │   ├── function_name_1/   # 每个函数一个目录
  │   │   ├── index.ts       # 函数入口文件
  │   │   ├── _shared/       # 函数间共享代码 (可选)
  │   │   └── deno.json      # Deno 配置文件 (可选)
  │   └── function_name_2/
  │       └── ...
  ├── seed.sql               # (可选) 数据库初始数据填充脚本
  ├── config.toml            # Supabase CLI 项目配置文件
  └── .gitignore
```

**集成说明:**
- **数据库迁移:** 通过 `supabase/migrations` 管理，并使用Supabase CLI应用到不同环境。
- **Edge Functions:** 代码在 `supabase/functions` 中开发，通过Supabase CLI部署。
- **类型同步:** 可以考虑使用工具 (如 `openapi-typescript-codegen` 配合Supabase导出的OpenAPI规范，或直接从数据库模式生成类型) 来保持前后端类型的一致性，并将生成的类型文件放置在前端的 `src/types/supabase.d.ts` 或类似位置。

## 5. 关键目录说明

- **`src/api/`**: 存放所有与后端Supabase交互的API请求函数。按业务模块组织，例如 `src/api/news.ts` 处理新闻相关的CRUD操作。这些函数内部使用Supabase JS Client。
- **`src/components/`**: 存放全局可复用的Vue组件。
    - `Common/`: 与业务无关的纯UI组件或基础功能组件。
    - `Business/`: 包含特定业务逻辑但可在多个页面复用的组件。
- **`src/enums/`**: 存放项目中使用的枚举值，提高代码可读性和可维护性。
- **`src/hooks/`**: 存放自定义的Vue Composition API Hooks，用于封装和复用有状态逻辑或副作用。
- **`src/layouts/`**: 存放整体页面布局组件，Pure Admin已提供基础布局。
- **`src/router/`**: 定义应用的所有路由规则和导航守卫。
    - `modules/`: 将大型应用的路由按模块拆分，便于管理。
- **`src/store/`**: 使用Pinia进行状态管理。
    - `modules/`: 每个业务模块可以有自己的Store模块。
- **`src/types/`**: 存放所有的TypeScript类型定义。
    - `api/`: API请求和响应的数据结构类型。
    - `models/`: 核心业务对象的模型类型，应与后端数据库模型保持一致。
    - `supabase.d.ts` (建议): 用于存放通过工具从Supabase schema生成的类型，或手动定义的Supabase特有类型。
- **`src/utils/`**: 存放通用的工具函数，如日期格式化、数据校验、Supabase客户端实例封装等。
- **`src/views/`**: 存放应用的页面级组件。按业务模块组织，与路由对应。

## 6. AI 代理实现优化建议

- **明确的API层 (`src/api/`)**: AI代理可以清晰地找到发起后端请求的位置。
- **类型定义 (`src/types/`)**: 强类型有助于AI代理理解数据结构和函数签名。
- **模块化路由和状态 (`src/router/modules/`, `src/store/modules/`)**: AI代理可以更容易地定位和修改特定模块的功能。
- **可复用组件 (`src/components/`) 和 Hooks (`src/hooks/`)**: AI代理可以利用这些来构建新功能，减少重复代码。
- **文档和注释**: 虽然本文档定义了结构，但良好的代码内注释对AI代理同样重要。

此项目结构旨在提供一个坚实的基础，并可根据项目的具体发展进行调整。 
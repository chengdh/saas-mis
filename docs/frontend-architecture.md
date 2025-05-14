# 前端架构文档 (Frontend Architecture)

## 1. 简介

本文档详细描述了企业级SaaS管理信息系统平台的前端架构。前端基于 **Pure Admin 精简版 (Thin)** 模板构建，采用 **Vue 3**, **TypeScript**, **Vite**, **Element Plus**, **Pinia** 和 **Vue Router** 等主流技术栈。

本文档旨在为前端开发团队提供清晰的架构指引，确保代码的一致性、可维护性、可扩展性和高性能。

## 2. 核心技术与选型理由

参考 `docs/tech-stack.md` 获取详细的技术选型和理由。

- **Vue 3:** 核心框架，提供响应式数据绑定、组件化、Composition API 等特性。
- **TypeScript:** 增强代码类型安全和可维护性。
- **Vite:** 高性能的前端构建工具。
- **Pure Admin (Thin Template):** 提供基础后台管理框架、常用布局、路由和权限控制方案，加速开发。
- **Element Plus:** UI组件库，提供丰富的预设组件。
- **Pinia:** 状态管理库，用于管理全局和模块化状态。
- **Vue Router:** 官方路由管理器，用于构建单页应用 (SPA)。
- **Supabase JS Client:** 用于与Supabase后端服务 (Auth, Database, Storage, Edge Functions) 进行交互。

## 3. 整体架构图 (前端视角)

```mermaid
graph TD
    subgraph "浏览器 (Browser)"
        UserInteraction[用户交互]
    end

    subgraph "Vue 3 应用 (Pure Admin Based)"
        Views[页面视图 (Views/Pages)]
        Components[可复用组件 (Components)]
        Layouts[布局组件 (Layouts)]
        Router[Vue Router (路由管理)]
        Store[Pinia Store (状态管理)]
        API[API模块 (src/api - Supabase JS Client)]
        Utils[工具函数 (Utils)]
        Hooks[组合式函数 (Hooks)]
        Styles[样式 (SCSS)]
        Assets[静态资源 (Assets)]
    end

    subgraph "构建与开发 (Vite)"
        ViteDevServer[Vite 开发服务器 (HMR)]
        ViteBuild[Vite 构建 (优化、打包)]
    end

    subgraph "后端服务 (Supabase)"
        SupabaseBaaS[Supabase (Auth, DB, Storage, Functions)]
    end

    UserInteraction --> Views
    Views --> Components
    Views --> Layouts
    Views --> Router
    Views --> Store
    Views --> Hooks

    Components --> Store
    Components --> Hooks
    Components --> API

    Layouts --> Router
    Layouts --> Store

    Router -.-> Views
    Store -.-> Views
    Store -.-> Components

    Hooks --> API
    Hooks --> Store

    API -- HTTP/WebSocket --> SupabaseBaaS

    %% Build Process
    ViteDevServer --> Views
    ViteBuild --> Assets

    %% Project Structure Links (conceptual)
    %% ProjectFiles[Project Files src/*] --> ViteDevServer
    %% ProjectFiles --> ViteBuild

    style Views fill:#c9f7f5,stroke:#1bc5bd,stroke-width:2px
    style Components fill:#c9f7f5,stroke:#1bc5bd,stroke-width:2px
    style Layouts fill:#c9f7f5,stroke:#1bc5bd,stroke-width:2px
    style Router fill:#ffe2e5,stroke:#f64e60,stroke-width:2px
    style Store fill:#ffe2e5,stroke:#f64e60,stroke-width:2px
    style API fill:#fff4de,stroke:#ffa800,stroke-width:2px
    style SupabaseBaaS fill:#e8efff,stroke:#6993ff,stroke-width:2px
```

## 4. 目录结构

详细的目录结构请参考 `docs/project-structure.md`。
关键前端目录包括：
- `src/`: 源码主目录。
- `src/main.ts`: 应用入口。
- `src/App.vue`: 根组件。
- `src/router/`: 路由配置。
- `src/store/`: Pinia状态管理。
- `src/views/`: 页面级组件。
- `src/components/`: 全局可复用组件。
- `src/layouts/`: 布局组件 (Pure Admin提供或自定义)。
- `src/api/`: 与Supabase后端交互的封装。
- `src/hooks/`: Composition API Hooks。
- `src/utils/`: 通用工具函数。
- `src/types/`: TypeScript类型定义。
- `src/assets/`: 静态资源 (图片、字体等)。
- `src/styles/`: 全局和组件样式。
- `public/`: 不会被Vite处理的静态资源。

## 5. 组件化策略

- **页面组件 (`src/views/`):**
    - 对应一个具体的路由页面。
    - 负责组织该页面的布局和子组件，获取和传递数据给子组件，处理页面级别的用户交互。
    - 通常会调用 `src/api/` 中的函数获取数据，并通过 `src/store/` 管理页面相关的状态或从全局状态中获取数据。
- **布局组件 (`src/layouts/`):**
    - Pure Admin提供了基础后台布局 (如侧边栏、头部导航、内容区域)。
    - 可根据需求自定义或扩展布局。
- **全局可复用组件 (`src/components/`):**
    - **`Common/`:** 与业务逻辑无关的纯UI组件或基础功能组件 (例如自定义按钮、模态框封装、图标组件等)。
    - **`Business/`:** 包含特定业务逻辑但可在多个页面或模块中复用的组件 (例如租户选择器、用户搜索框等)。
    - 组件应设计为高内聚、低耦合，通过Props接收数据，通过Emits向上通知事件。
- **组合式函数 (Hooks - `src/hooks/`):**
    - 使用Vue 3 Composition API将可复用的有状态逻辑或副作用封装成Hooks。
    - 例如：`usePagination`, `useFormValidation`, `useSupabaseQuery` (封装通用Supabase数据获取逻辑)。
    - Hooks使得逻辑在不同组件间共享更加方便和类型安全。

## 6. 状态管理 (Pinia)

- **目的:** 集中管理应用的全局状态、用户会话信息、权限以及复杂模块的局部状态。
- **模块化:** 在 `src/store/modules/` 目录下按业务模块或功能领域划分Store。
    - `user.ts`: 存储用户信息 (如ID, email, full_name, avatar_url), JWT令牌，用户角色和权限。
    - `app.ts`: (Pure Admin可能提供) 应用全局配置，如侧边栏状态、主题、语言等。
    - `permission.ts`: (Pure Admin可能提供) 存储处理过的路由权限、动态路由等。
    - `settings.ts`: (Pure Admin可能提供) 系统持久化设置。
    - 业务模块Store: 例如 `newsStore.ts` (管理新闻列表、当前编辑的新闻等状态)，`workflowStore.ts`。
- **核心概念:**
    - **State:** 定义状态的响应式数据。
    - **Getters:** 类似于计算属性，用于派生状态。
    - **Actions:** 用于执行异步操作或批量同步操作来变更状态。API调用通常在Actions中发起。
- **与组件交互:**
    - 组件通过 `import { useUserStore } from '@/store/modules/user'; const userStore = useUserStore();` 来使用Store。
    - 直接访问 `userStore.propertyName` 获取状态或Getter。
    - 调用 `userStore.actionName()` 执行操作。
- **持久化:** 对于需要持久化的状态 (如用户偏好设置、部分认证信息)，可以使用Pinia插件 (如 `pinia-plugin-persistedstate`) 将其存储到LocalStorage或SessionStorage。

## 7. 路由管理 (Vue Router)

- **配置:** 在 `src/router/index.ts` 中配置路由实例，并在 `src/router/modules/` 中按模块拆分路由配置。
- **路由模式:** 使用 `history` 模式 (HTML5 History API)，URL更美观。需要服务器端配置支持 (Supabase Storage托管静态网站时，配置重定向规则)。
- **路由定义:**
    - `path`: 路由路径。
    - `name`: 路由名称 (用于编程式导航和`<keep-alive>`)。
    - `component`: 对应的页面组件 (`src/views/` 下的组件)，通常使用动态导入 `() => import('@/views/MyPage.vue')` 实现路由懒加载。
    - `meta`: 路由元信息，用于存储额外信息，如：
        - `title`: 页面标题 (用于浏览器标签和面包屑)。
        - `roles`: 允许访问该路由的角色列表 (用于权限控制)。
        - `requiresAuth`: 是否需要认证才能访问。
        - `keepAlive`: 是否缓存该路由对应的组件实例 (Pure Admin支持)。
        - `icon`: 侧边栏菜单图标 (Pure Admin支持)。
- **导航守卫 (`src/router/guard.ts`):**
    - **全局前置守卫 (`router.beforeEach`):**
        - **权限检查:** 检查用户是否登录，以及是否有权限访问目标路由 (基于 `meta.requiresAuth` 和 `meta.roles` 以及Pinia中存储的用户角色)。
        - 未登录则重定向到登录页。
        - 无权限则重定向到403页面。
        - **页面标题设置:** 根据 `to.meta.title` 更新浏览器标题。
        - **NProgress进度条:** (Pure Admin集成) 在路由切换时显示进度条。
    - **全局后置守卫 (`router.afterEach`):** 用于清理工作或统计。
- **动态路由:** Pure Admin的权限方案通常涉及根据用户角色动态添加路由。

## 8. 与Supabase的交互

- **Supabase JS Client:** 在 `src/utils/supabase.ts` (或类似文件) 中初始化并导出Supabase客户端单例。
    ```typescript
    // src/utils/supabase.ts
    import { createClient } from '@supabase/supabase-js';

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase URL or Anon Key is missing. Check your .env file.');
    }

    export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      // global client options...
    });
    ```
- **API模块 (`src/api/`):**
    - 将所有与Supabase特定表或功能的交互封装在此目录下的模块文件中。
    - 例如 `src/api/news.ts` 包含 `fetchNews`, `createNews`, `updateNews` 等函数。
    - 这些函数内部使用导入的 `supabase` 客户端实例进行操作。
    - 处理数据转换 (例如，`snake_case` 到 `camelCase`) 和错误处理。
- **类型安全:**
    - 在 `src/types/models/` 中定义与Supabase表结构对应的TypeScript接口/类型。
    - 在 `src/types/api/` 中定义API请求参数和响应数据的类型。
    - 考虑使用工具从Supabase数据库模式自动生成TypeScript类型定义 (例如 `supabase gen types typescript --project-id <ref> --schema public > src/types/supabase.d.ts`)。
- **认证流程:**
    - 登录/注册页面调用 `src/api/auth.ts` (或直接使用Supabase client) 中的认证函数。
    - 成功后，Supabase JS Client会自动处理JWT的存储和刷新。
    - `userStore` 监听认证状态变化 (`supabase.auth.onAuthStateChange`)，并更新用户状态和权限。
    - API请求时，Supabase JS Client自动在请求头中携带JWT。

## 9. UI与样式

- **Element Plus:** 作为主要的UI组件库，提供表单、表格、弹窗、导航等常用组件。
- **Pure Admin封装组件:** Pure Admin本身可能封装了一些基于Element Plus的业务组件或布局组件。
- **自定义组件:** 根据需求开发自定义的通用组件和业务组件。
- **样式方案 (SCSS):**
    - 全局样式: `src/styles/index.scss` (引入reset, variables, mixins, element-plus主题覆盖等)。
    - 组件样式: Vue单文件组件中的 `<style lang="scss" scoped>`。
    - 主题定制: 通过覆盖Element Plus的SCSS变量或Pure Admin提供的主题配置机制来实现。
    - 遵循 `docs/coding-standards.md` 中的CSS/SCSS规范。

## 10. 构建与优化 (Vite)

- **开发模式:** Vite提供极速的冷启动和热模块替换 (HMR)。
- **生产构建:** `npm run build` (或类似脚本) 执行Vite的生产构建。
    - 代码压缩、混淆。
    - CSS提取和压缩。
    - Tree-shaking移除未使用代码。
    - Chunk分离和代码分割 (通过动态导入实现路由懒加载)。
- **环境变量:** 通过 `.env.[mode]` 文件管理不同环境的配置。
- **路径别名:** Vite配置 (`vite.config.ts`) 中设置路径别名 (如 `@/` 指向 `src/`) 以简化导入。

## 11. 性能优化考虑

- **路由懒加载:** 减小初始包体积。
- **组件懒加载:** 对于非首屏或不常用的复杂组件，可以考虑异步组件。
- **图片优化:** 使用合适的图片格式、压缩图片、使用CDN。
- **虚拟滚动:** 对于长列表，使用虚拟滚动技术提高渲染性能。
- **`debounce` 和 `throttle`:** 用于优化高频事件处理 (如输入搜索、窗口resize)。
- **Memoization:** 对于计算成本高的函数或计算属性，考虑使用 `computed` 或自定义memoization。
- **Bundle分析:** 定期使用 `rollup-plugin-visualizer` 等工具分析打包结果，找出可优化点。

本文档为前端架构的指导性说明，具体实现细节可能随项目进展而调整。 
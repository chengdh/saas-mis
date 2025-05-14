# API 参考文档 (API Reference)

## 1. 简介

本文档为企业级SaaS管理信息系统平台提供API设计指导原则和核心交互模式参考。由于后端采用Supabase BaaS (Backend as a Service)，大部分数据交互将通过Supabase提供的客户端SDK (如 `supabase-js`) 进行，这些SDK封装了对PostgreSQL数据库、Auth、Storage和Edge Functions的RESTful或WebSocket访问。

本文档侧重于定义与Supabase交互的模式、数据结构约定以及Edge Functions (如果设计为可直接调用的API端点) 的规范。

## 2. 设计原则

- **资源导向:** API应围绕资源进行组织 (例如 `users`, `news_articles`, `workflows`)。
- **一致性:** API交互模式、命名约定、错误处理应在整个系统中保持一致。
- **安全性:** 所有需要认证的API交互必须通过Supabase Auth进行保护，并遵循最小权限原则。
- **无状态性:** Supabase的RESTful接口是无状态的，每个请求都应包含所有必要信息 (通常通过JWT)。
- **清晰的错误响应:** Supabase客户端会返回结构化的错误信息，前端应妥善处理。
- **版本控制:** Supabase平台自身会进行版本迭代。对于自定义的Edge Functions，如果其API发生重大变更，应考虑版本控制策略 (例如，URL路径版本 `/v1/my-function` 或头部版本)。

## 3. 认证与授权

- **认证:** 所有需要保护的API交互都依赖于Supabase Auth。
    - 用户通过Supabase Auth提供的机制 (如邮箱密码、社交登录) 进行认证。
    - 认证成功后，Supabase Auth会签发JWT (JSON Web Token)。
    - 前端在后续请求中，通过Supabase JS Client自动将JWT附加到请求头 (`Authorization: Bearer <JWT>`)。
- **授权:**
    - **行级安全 (RLS):** Supabase PostgreSQL的核心授权机制。RLS策略基于用户的`user_id`、`tenant_id`和角色 (可以存储在用户元数据或单独的表中) 来控制对数据库行级别数据的访问。
    - **角色基础访问控制 (RBAC):**
        - 用户角色信息可以存储在Supabase用户的 `app_metadata` 或单独的 `user_roles` 表中。
        - RLS策略和Edge Functions的逻辑可以基于这些角色来决定操作权限。
        - 前端也会根据角色信息控制UI元素的可见性和可操作性。
    - **Edge Functions:** 自定义的Edge Functions内部需要显式检查用户身份和权限，除非它们被设计为公共访问或由内部服务调用。

## 4. 数据格式

- **请求/响应体:** Supabase JS Client通常处理JSON格式的数据。
- **日期和时间:** 遵循ISO 8601格式 (例如 `YYYY-MM-DDTHH:mm:ss.sssZ`)。
- **命名约定:**
    - **数据库表名和列名:** 推荐使用 `snake_case` (例如 `news_articles`, `created_at`)，这是PostgreSQL的常见约定。
    - **前端模型/类型属性名:** 推荐使用 `camelCase` (例如 `newsArticles`, `createdAt`)。在API客户端或数据转换层进行转换。
    - **Edge Function参数/响应JSON:** 推荐使用 `camelCase` 与前端保持一致。

## 5. 与 Supabase 服务交互模式

### 5.1 Supabase Database (PostgreSQL)

通过 `supabase-js` SDK与数据库交互。SDK提供了简洁的API用于执行CRUD操作。

**示例：查询新闻列表**
```typescript
// src/api/news.ts (示例)
import { supabase } from '@/utils/supabase'; // 假设supabase客户端实例在这里初始化
import type { NewsArticle } from '@/types/models/news.d.ts';

interface FetchNewsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  filter?: Record<string, any>; // 示例，具体过滤条件需要定义
}

export async function fetchNewsArticles(params: FetchNewsParams = {}): Promise<{ data: NewsArticle[]; count: number | null; error: any }> {
  const { page = 1, limit = 10, sortBy = 'created_at', order = 'desc', filter } = params;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('news_articles') // 表名 news_articles
    .select('id, title, summary, content, author_id, tenant_id, created_at, updated_at', { count: 'exact' });

  if (filter) {
    // 示例：query = query.eq('category_id', filter.categoryId);
    // RLS 会自动应用，无需显式添加 tenant_id 过滤 (除非是特殊管理员场景)
  }

  query = query.order(sortBy, { ascending: order === 'asc' });
  query = query.range(from, to);

  const { data, error, count } = await query;
  return { data: data as NewsArticle[], count, error };
}

// 其他操作：createNewsArticle, updateNewsArticle, deleteNewsArticle 等
```

- **表和字段:** 参考 `docs/data-models.md`。
- **RLS策略:** 将自动应用，确保用户只能访问其租户的数据和权限范围内的数据。

### 5.2 Supabase Auth

通过 `supabase-js` SDK进行用户认证操作。

- **注册:** `supabase.auth.signUp({ email, password, options: { data: { full_name: '...', tenant_id: '...' } } })`
- **登录:** `supabase.auth.signInWithPassword({ email, password })`
- **获取当前用户:** `supabase.auth.getUser()`
- **获取Session (含JWT):** `supabase.auth.getSession()`
- **登出:** `supabase.auth.signOut()`
- **监听认证状态变化:** `supabase.auth.onAuthStateChange((event, session) => { ... })`

### 5.3 Supabase Storage

通过 `supabase-js` SDK进行文件上传、下载、删除等操作。

- **上传文件:** `supabase.storage.from('bucket-name').upload('path/to/file.png', fileObject)`
- **获取文件公共URL:** `supabase.storage.from('bucket-name').getPublicUrl('path/to/file.png')`
- **下载文件:** `supabase.storage.from('bucket-name').download('path/to/file.png')`
- **存储桶 (Buckets):** 例如，`avatars` (用户头像), `documents` (业务文档), `news_attachments` (新闻附件)。每个存储桶可以配置不同的访问策略。

### 5.4 Supabase Edge Functions

Edge Functions用于执行不能在客户端安全执行或需要访问受保护资源的服务器端逻辑。它们可以通过HTTPS直接调用。

- **调用方式:** 通常使用 `supabase.functions.invoke('function-name', { body: { key: 'value' } })`。
- **请求/响应:** 通常使用JSON。
- **认证:** Edge Functions可以通过读取请求中的JWT来识别用户并执行权限检查。

**示例：一个简单的Edge Function (`hello-world`)**

`supabase/functions/hello-world/index.ts`:
```typescript
// @ts-ignore (Deno Deploy/Supabase Functions specific import)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req: Request) => {
  const { name } = await req.json()
  const data = {
    message: `Hello ${name} from a Supabase Edge Function!`,
  }

  // 可以从 req.headers.get('Authorization') 获取 JWT 并验证
  // const authHeader = req.headers.get('Authorization')!
  // const jwt = authHeader.replace('Bearer ', '')
  // const { data: { user } } = await supabaseClient.auth.getUser(jwt) // 需要 Supabase 客户端实例

  return new Response(
    JSON.stringify(data),
    { headers: { "Content-Type": "application/json" } },
  )
})
```

**调用此Edge Function:**
```typescript
// src/api/general.ts
import { supabase } from '@/utils/supabase';

export async function callHelloWorld(name: string): Promise<{ message: string } | null> {
  const { data, error } = await supabase.functions.invoke('hello-world', {
    body: { name },
  });

  if (error) {
    console.error('Error invoking Edge Function:', error);
    return null;
  }
  return data;
}
```

## 6. 核心业务API交互模式 (示例)

以下列出部分核心业务的API交互模式，具体实现将通过Supabase JS Client操作数据库或调用Edge Functions。

### 6.1 企业管理 (Tenant Management)

- **创建企业 (租户):** (可能通过特定注册流程或管理员操作)
    - 涉及在 `tenants` 表插入记录。
    - 关联创建者用户到该租户。
- **获取当前用户所属企业信息:**
    - `supabase.from('tenants').select('*').eq('id', userTenantId).single()`
- **更新企业信息:**
    - `supabase.from('tenants').update({ name: 'New Name' }).eq('id', tenantId)` (需RLS配合)

### 6.2 新闻管理 (News Management)

- **获取新闻列表 (分页、排序、过滤):** (见5.1示例 `fetchNewsArticles`)
- **创建新闻:**
    - `supabase.from('news_articles').insert([{ title, content, author_id, tenant_id }])`
- **更新新闻:**
    - `supabase.from('news_articles').update({ title, content }).eq('id', articleId)`
- **删除新闻:**
    - `supabase.from('news_articles').delete().eq('id', articleId)`

### 6.3 用户管理 (User Management within a Tenant)

- **邀请用户到租户:** (可能通过Edge Function发送邀请链接)
- **获取租户内用户列表:**
    - `supabase.from('users').select('*').eq('tenant_id', currentTenantId)` (假设 `users` 表有 `tenant_id`)
    - 或者通过 `auth.admin.listUsers()` (如果使用管理员权限，需Edge Function封装)
- **更新用户信息/角色:** (可能需要Edge Function封装以保证权限)

*具体API端点和数据结构将在各个模块详细设计时进一步明确，并记录在相应模块的文档或 `src/api/` 和 `src/types/` 目录下。*

## 7. 错误处理

Supabase JS Client的每个操作都会返回 `{ data, error }` 对象。

- **`error` 对象:** 包含错误信息 (如 `message`, `status`, `code`)。
- **前端处理:**
    - 检查 `error` 是否存在。
    - 根据错误类型向用户显示友好的提示 (例如，使用Element Plus的通知组件)。
    - 对于需要调试的错误，在控制台打印详细错误信息。
    - 对于特定错误代码 (例如认证失败 `401 Unauthorized`)，执行相应操作 (例如，跳转到登录页)。

```typescript
// 示例错误处理
async function fetchData() {
  const { data, error } = await supabase.from('some_table').select('*');
  if (error) {
    console.error('Supabase error:', error);
    // 根据 error.status 或 error.code 显示不同消息
    if (error.status === 401) {
      // 跳转到登录
    } else {
      // 显示通用错误消息给用户
    }
    return;
  }
  // 处理 data
}
```

## 8. API文档工具 (针对Edge Functions)

如果大量使用可直接调用的Edge Functions作为API，可以考虑使用Swagger/OpenAPI规范来描述它们，并使用工具生成文档。
- Supabase本身也可能提供其API的OpenAPI描述，可用于生成客户端类型。

本文档为API交互提供了高级指导。详细的请求/响应模型将在数据模型 (`docs/data-models.md`) 和TypeScript类型定义 (`src/types/`) 中具体化。 
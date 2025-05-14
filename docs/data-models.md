# 数据模型文档 (Data Models)

## 1. 简介

本文档定义了企业级SaaS管理信息系统平台的核心数据模型和数据库表结构。这些模型基于Supabase (PostgreSQL) 构建，并充分考虑了多租户数据隔离、关系完整性和查询效率。

所有表名和列名遵循 `snake_case` 命名约定。

## 2. 通用约定与RLS (Row Level Security)

- **租户ID (`tenant_id`):** 大部分核心业务表都将包含一个 `tenant_id` (UUID类型) 列，用于标识数据所属的租户 (企业)。这是实现多租户数据隔离的关键。
- **主键 (`id`):** 默认情况下，所有表的主键为 `id`，类型为 `UUID`，并自动生成 (`uuid_generate_v4()`)。
- **时间戳:**
    - `created_at`: 记录创建时间，类型为 `TIMESTAMPTZ`，默认值为 `now()`。
    - `updated_at`: 记录最后更新时间，类型为 `TIMESTAMPTZ`，默认值为 `now()`。可以设置触发器自动更新此字段。
- **行级安全 (RLS):**
    - **默认启用:** 所有包含 `tenant_id` 的表都将启用RLS。
    - **策略核心:**
        - **SELECT/UPDATE/DELETE:** 用户只能对自己 `tenant_id` 的数据进行操作。`auth.uid()` 用于获取当前用户ID，用户的`tenant_id` 可以从JWT的`app_metadata`中获取，或者通过一个关联表（如`user_profiles`）查询得到。
        - **INSERT:** 新插入的数据行必须包含当前用户的 `tenant_id`。
    - **示例RLS策略 (通用模板):**
      ```sql
      -- 启用RLS
      ALTER TABLE public.your_table ENABLE ROW LEVEL SECURITY;

      -- 允许租户成员读取其租户的数据
      CREATE POLICY "Allow tenant members to read their tenant data" ON public.your_table
      FOR SELECT USING (auth.jwt()->>'app_metadata'->>'tenant_id')::uuid = tenant_id;

      -- 允许租户成员插入数据到其租户
      CREATE POLICY "Allow tenant members to insert data into their tenant" ON public.your_table
      FOR INSERT WITH CHECK (auth.jwt()->>'app_metadata'->>'tenant_id')::uuid = tenant_id;

      -- 允许租户成员更新其租户的数据
      CREATE POLICY "Allow tenant members to update their tenant data" ON public.your_table
      FOR UPDATE USING (auth.jwt()->>'app_metadata'->>'tenant_id')::uuid = tenant_id;

      -- 允许租户成员删除其租户的数据
      CREATE POLICY "Allow tenant members to delete their tenant data" ON public.your_table
      FOR DELETE USING (auth.jwt()->>'app_metadata'->>'tenant_id')::uuid = tenant_id;
      ```
      *注意: 上述 `auth.jwt()->>'app_metadata'->>'tenant_id'` 只是一个示例，实际获取租户ID的方式可能依赖于JWT的具体声明或通过辅助函数获取。*
- **用户ID (`user_id`):** 许多表还会包含 `user_id` (UUID类型) 列，用于关联到Supabase Auth中的用户，通常用于记录创建者、负责人等。

## 3. 核心数据表

### 3.1 `tenants` (租户/企业表)

存储每个企业客户的信息。

| 列名             | 数据类型    | 约束/说明                                      |
| :--------------- | :---------- | :--------------------------------------------- |
| `id`             | `UUID`      | 主键, `DEFAULT uuid_generate_v4()`             |
| `name`           | `TEXT`      | `NOT NULL`, 企业名称                           |
| `slug`           | `TEXT`      | `UNIQUE`, 企业唯一标识 (用于URL等，可选)        |
| `owner_id`       | `UUID`      | `REFERENCES auth.users(id)`, 企业创建者/所有者 |
| `industry`       | `TEXT`      | 行业 (可选)                                    |
| `address`        | `TEXT`      | 地址 (可选)                                    |
| `logo_url`       | `TEXT`      | 企业Logo URL (可选)                            |
| `settings`       | `JSONB`     | 企业特定配置 (可选)                            |
| `subscription_status` | `TEXT`   | 订阅状态 (e.g., 'active', 'trial', 'canceled') |
| `created_at`     | `TIMESTAMPTZ`| `DEFAULT now()`                                |
| `updated_at`     | `TIMESTAMPTZ`| `DEFAULT now()`                                |

**RLS策略:** 通常不由普通租户用户直接修改，可能由超级管理员或特定注册流程管理。如果允许租户管理员修改，则需要相应策略。

### 3.2 `user_profiles` (用户档案表)

存储应用用户的额外信息，关联到 `auth.users` 表。

| 列名             | 数据类型    | 约束/说明                                      |
| :--------------- | :---------- | :--------------------------------------------- |
| `id`             | `UUID`      | 主键, `REFERENCES auth.users(id) ON DELETE CASCADE`, 与 `auth.users.id` 一致 |
| `tenant_id`      | `UUID`      | `NOT NULL, REFERENCES tenants(id) ON DELETE CASCADE`, 用户所属租户 |
| `full_name`      | `TEXT`      | 用户全名                                       |
| `avatar_url`     | `TEXT`      | 用户头像URL                                    |
| `job_title`      | `TEXT`      | 职位 (可选)                                    |
| `phone_number`   | `TEXT`      | 电话号码 (可选)                                |
| `metadata`       | `JSONB`     | 其他用户相关元数据 (可选)                        |
| `created_at`     | `TIMESTAMPTZ`| `DEFAULT now()`                                |
| `updated_at`     | `TIMESTAMPTZ`| `DEFAULT now()`                                |

**RLS策略:**
- 用户可以读取和更新自己的profile。
- 同一租户内的管理员或特定角色用户可能可以读取该租户下其他用户的profile (根据具体需求定义策略)。
```sql
-- 允许用户读取和更新自己的profile
CREATE POLICY "Allow users to read and update their own profile" ON public.user_profiles
FOR ALL USING (auth.uid() = id)
WITH CHECK (auth.uid() = id AND (auth.jwt()->>'app_metadata'->>'tenant_id')::uuid = tenant_id);

-- (可选) 允许同一租户的管理员读取用户profile (需要角色判断逻辑)
-- CREATE POLICY "Allow tenant admins to read user profiles in their tenant" ON public.user_profiles
-- FOR SELECT USING (is_tenant_admin(auth.uid(), tenant_id)); -- is_tenant_admin 为自定义函数
```

### 3.3 `roles` (角色表)

定义系统中的角色。

| 列名          | 数据类型    | 约束/说明                         |
| :------------ | :---------- | :-------------------------------- |
| `id`          | `SERIAL`    | 主键 (或 `UUID`)                  |
| `tenant_id`   | `UUID`      | `REFERENCES tenants(id) ON DELETE CASCADE` (如果角色是租户特定的), 或 `NULL` (全局角色) |
| `name`        | `TEXT`      | `NOT NULL`, 角色名称 (e.g., 'admin', 'editor', 'member') |
| `permissions` | `JSONB`     | 角色拥有的权限列表 (可选)           |
| `description` | `TEXT`      | 角色描述 (可选)                     |
| `created_at`  | `TIMESTAMPTZ`| `DEFAULT now()`                   |
| `updated_at`  | `TIMESTAMPTZ`| `DEFAULT now()`                   |

**RLS策略:** 通常由租户管理员或系统管理员管理。

### 3.4 `user_roles` (用户角色关联表)

将用户分配给角色。

| 列名          | 数据类型    | 约束/说明                                   |
| :------------ | :---------- | :------------------------------------------ |
| `user_id`     | `UUID`      | `NOT NULL, REFERENCES user_profiles(id) ON DELETE CASCADE` |
| `role_id`     | `INTEGER`   | `NOT NULL, REFERENCES roles(id) ON DELETE CASCADE` (如果 `roles.id` 是 `SERIAL`) |
| `tenant_id`   | `UUID`      | `NOT NULL, REFERENCES tenants(id) ON DELETE CASCADE` |
| `created_at`  | `TIMESTAMPTZ`| `DEFAULT now()`                             |
|               |             | `PRIMARY KEY (user_id, role_id, tenant_id)` |

**RLS策略:** 通常由租户管理员管理。
*可以将 `user_id` 和 `tenant_id` 直接关联到 `auth.users` 和 `tenants`，并确保组合键的唯一性。*
*或者将用户的角色信息直接存储在 `auth.users.app_metadata` 中，以简化查询，但管理上可能不如单独表灵活。*

### 3.5 `news_articles` (新闻文章表)

存储新闻和公告信息。

| 列名          | 数据类型    | 约束/说明                                     |
| :------------ | :---------- | :-------------------------------------------- |
| `id`          | `UUID`      | 主键, `DEFAULT uuid_generate_v4()`            |
| `tenant_id`   | `UUID`      | `NOT NULL, REFERENCES tenants(id) ON DELETE CASCADE` |
| `author_id`   | `UUID`      | `NOT NULL, REFERENCES user_profiles(id)`, 文章作者 |
| `title`       | `TEXT`      | `NOT NULL`, 文章标题                          |
| `slug`        | `TEXT`      | `UNIQUE` (在租户内唯一，可选), URL友好标识    |
| `summary`     | `TEXT`      | 文章摘要 (可选)                               |
| `content`     | `TEXT`      | 文章内容 (富文本)                             |
| `status`      | `TEXT`      | `DEFAULT 'draft'` (e.g., 'draft', 'published', 'archived') |
| `category_id` | `UUID`      | `REFERENCES news_categories(id)` (可选)     |
| `tags`        | `TEXT[]`    | 标签数组 (可选)                               |
| `cover_image_url` | `TEXT`  | 封面图片URL (可选)                            |
| `published_at`| `TIMESTAMPTZ`| 发布时间 (可选)                               |
| `created_at`  | `TIMESTAMPTZ`| `DEFAULT now()`                               |
| `updated_at`  | `TIMESTAMPTZ`| `DEFAULT now()`                               |

**RLS策略:** 标准租户隔离策略。特定角色 (如编辑) 才能创建/更新/删除。

### 3.6 `news_categories` (新闻分类表)

存储新闻分类信息。

| 列名          | 数据类型    | 约束/说明                                     |
| :------------ | :---------- | :-------------------------------------------- |
| `id`          | `UUID`      | 主键, `DEFAULT uuid_generate_v4()`            |
| `tenant_id`   | `UUID`      | `NOT NULL, REFERENCES tenants(id) ON DELETE CASCADE` |
| `name`        | `TEXT`      | `NOT NULL`, 分类名称                          |
| `slug`        | `TEXT`      | `UNIQUE` (在租户内唯一), URL友好标识         |
| `description` | `TEXT`      | 分类描述 (可选)                               |
| `created_at`  | `TIMESTAMPTZ`| `DEFAULT now()`                               |
| `updated_at`  | `TIMESTAMPTZ`| `DEFAULT now()`                               |

**RLS策略:** 标准租户隔离策略。特定角色才能管理。

### 3.7 `employees` (员工档案表 - 人力资源模块)

| 列名             | 数据类型     | 约束/说明                                                        |
| :--------------- | :----------- | :--------------------------------------------------------------- |
| `id`             | `UUID`       | 主键, `DEFAULT uuid_generate_v4()`                               |
| `user_profile_id`| `UUID`       | `UNIQUE, REFERENCES user_profiles(id) ON DELETE CASCADE`, 关联用户档案 |
| `tenant_id`      | `UUID`       | `NOT NULL, REFERENCES tenants(id) ON DELETE CASCADE`               |
| `employee_id_code`| `TEXT`      | 员工工号 (租户内唯一，可选)                                         |
| `department_id`  | `UUID`       | `REFERENCES departments(id)` (可选), 所属部门                       |
| `position_id`    | `UUID`       | `REFERENCES positions(id)` (可选), 职位                            |
| `hire_date`      | `DATE`       | 入职日期                                                         |
| `employment_status` | `TEXT`    | 雇佣状态 (e.g., 'active', 'terminated', 'on_leave')            |
| `contract_info`  | `JSONB`      | 合同信息 (可选)                                                  |
| `salary_info`    | `JSONB`      | 薪资信息 (敏感，需额外保护或单独表)                                 |
| `created_at`     | `TIMESTAMPTZ`| `DEFAULT now()`                                                  |
| `updated_at`     | `TIMESTAMPTZ`| `DEFAULT now()`                                                  |

**RLS策略:** 标准租户隔离。HR角色或员工本人可访问，上级可访问下级部分信息等，需细化。

### 3.8 `departments` (部门表 - 人力资源模块)

| 列名          | 数据类型    | 约束/说明                                                        |
| :------------ | :---------- | :--------------------------------------------------------------- |
| `id`          | `UUID`      | 主键, `DEFAULT uuid_generate_v4()`                               |
| `tenant_id`   | `UUID`      | `NOT NULL, REFERENCES tenants(id) ON DELETE CASCADE`               |
| `name`        | `TEXT`      | `NOT NULL`, 部门名称                                             |
| `parent_department_id` | `UUID` | `REFERENCES departments(id)`, 上级部门 (用于组织架构)           |
| `manager_id`  | `UUID`      | `REFERENCES employees(id)` (或 `user_profiles(id)`), 部门负责人 |
| `description` | `TEXT`      | 部门描述 (可选)                                                  |
| `created_at`  | `TIMESTAMPTZ`| `DEFAULT now()`                                                  |
| `updated_at`  | `TIMESTAMPTZ`| `DEFAULT now()`                                                  |

**RLS策略:** 标准租户隔离。HR角色管理。

### 3.9 `kpi_templates` (KPI模板表 - 绩效管理模块)

| 列名          | 数据类型    | 约束/说明                                                        |
| :------------ | :---------- | :--------------------------------------------------------------- |
| `id`          | `UUID`      | 主键, `DEFAULT uuid_generate_v4()`                               |
| `tenant_id`   | `UUID`      | `NOT NULL, REFERENCES tenants(id) ON DELETE CASCADE`               |
| `name`        | `TEXT`      | `NOT NULL`, KPI模板名称                                          |
| `description` | `TEXT`      | 模板描述 (可选)                                                  |
| `criteria`    | `JSONB`     | KPI评估标准和权重 (e.g., `[{name: "Sales Target", weight: 0.4, target: 100000}, ...]`) |
| `created_by`  | `UUID`      | `REFERENCES user_profiles(id)`, 创建者                            |
| `created_at`  | `TIMESTAMPTZ`| `DEFAULT now()`                                                  |
| `updated_at`  | `TIMESTAMPTZ`| `DEFAULT now()`                                                  |

**RLS策略:** 标准租户隔离。特定角色 (如HR或管理员) 管理。

### 3.10 `kpi_assessments` (KPI评估表 - 绩效管理模块)

| 列名             | 数据类型     | 约束/说明                                                        |
| :--------------- | :----------- | :--------------------------------------------------------------- |
| `id`             | `UUID`       | 主键, `DEFAULT uuid_generate_v4()`                               |
| `tenant_id`      | `UUID`       | `NOT NULL, REFERENCES tenants(id) ON DELETE CASCADE`               |
| `employee_id`    | `UUID`       | `NOT NULL, REFERENCES employees(id)`, 被评估员工                   |
| `assessor_id`    | `UUID`       | `NOT NULL, REFERENCES user_profiles(id)`, 评估人 (可能是上级或HR)  |
| `kpi_template_id`| `UUID`       | `NOT NULL, REFERENCES kpi_templates(id)`, 使用的KPI模板            |
| `assessment_period_start` | `DATE` | 评估周期开始日期                                                 |
| `assessment_period_end`   | `DATE` | 评估周期结束日期                                                 |
| `scores`         | `JSONB`      | 各项KPI得分和评语 (e.g., `[{criterion_name: "Sales Target", score: 80, comment: "..."}, ...]`) |
| `overall_score`  | `NUMERIC`    | 总分 (可选, 可计算得出)                                           |
| `status`         | `TEXT`       | 评估状态 (e.g., 'pending_self_assessment', 'pending_manager_assessment', 'completed') |
| `self_assessment_notes` | `TEXT` | 员工自评备注                                                     |
| `manager_assessment_notes`| `TEXT`| 经理评审备注                                                     |
| `submitted_at`   | `TIMESTAMPTZ`| 提交时间                                                         |
| `completed_at`   | `TIMESTAMPTZ`| 完成时间                                                         |
| `created_at`     | `TIMESTAMPTZ`| `DEFAULT now()`                                                  |
| `updated_at`     | `TIMESTAMPTZ`| `DEFAULT now()`                                                  |

**RLS策略:** 标准租户隔离。员工可查看自己的，评估人可操作相关的，HR可查看租户内的。

### 3.11 `workflows` (工作流定义表 - 工作流管理模块)

| 列名          | 数据类型    | 约束/说明                                                        |
| :------------ | :---------- | :--------------------------------------------------------------- |
| `id`          | `UUID`      | 主键, `DEFAULT uuid_generate_v4()`                               |
| `tenant_id`   | `UUID`      | `NOT NULL, REFERENCES tenants(id) ON DELETE CASCADE`               |
| `name`        | `TEXT`      | `NOT NULL`, 工作流名称                                           |
| `description` | `TEXT`      | 工作流描述 (可选)                                                |
| `form_schema` | `JSONB`     | 工作流关联的表单定义 (JSON Schema)                                 |
| `flow_definition`| `JSONB`   | 工作流节点和流程定义 (e.g., BPMN-like JSON)                     |
| `status`      | `TEXT`      | `DEFAULT 'active'` (e.g., 'active', 'inactive', 'archived') |
| `created_by`  | `UUID`      | `REFERENCES user_profiles(id)`, 创建者                            |
| `created_at`  | `TIMESTAMPTZ`| `DEFAULT now()`                                                  |
| `updated_at`  | `TIMESTAMPTZ`| `DEFAULT now()`                                                  |

**RLS策略:** 标准租户隔离。特定角色 (如管理员) 可创建和管理。

### 3.12 `workflow_instances` (工作流实例表 - 工作流管理模块)

| 列名             | 数据类型     | 约束/说明                                                               |
| :--------------- | :----------- | :---------------------------------------------------------------------- |
| `id`             | `UUID`       | 主键, `DEFAULT uuid_generate_v4()`                                      |
| `workflow_id`    | `UUID`       | `NOT NULL, REFERENCES workflows(id)`, 关联的工作流定义                  |
| `tenant_id`      | `UUID`       | `NOT NULL, REFERENCES tenants(id) ON DELETE CASCADE`                      |
| `requester_id`   | `UUID`       | `NOT NULL, REFERENCES user_profiles(id)`, 发起人                         |
| `form_data`      | `JSONB`      | 实例的表单数据                                                          |
| `current_status` | `TEXT`       | 当前状态 (e.g., 'pending_approval', 'approved', 'rejected', 'completed') |
| `current_approver_ids` | `UUID[]` | 当前审批人ID列表 (如果一个节点有多个审批人或任一审批即可)                    |
| `history`        | `JSONB[]`    | 审批历史记录 (e.g., `[{node_id, approver_id, action, comment, timestamp}, ...]`) |
| `variables`      | `JSONB`      | 工作流实例的运行时变量 (可选)                                             |
| `created_at`     | `TIMESTAMPTZ`| `DEFAULT now()`                                                         |
| `updated_at`     | `TIMESTAMPTZ`| `DEFAULT now()`                                                         |
| `completed_at`   | `TIMESTAMPTZ`| 完成时间 (可选)                                                         |

**RLS策略:** 标准租户隔离。发起人、审批人、相关人员可查看或操作。

## 4. 关系图 (ERD - Simplified Mermaid)

```mermaid
erDiagram
    tenants {
        UUID id PK
        TEXT name
        UUID owner_id FK
        TIMESTAMPTZ created_at
    }

    user_profiles {
        UUID id PK "FK to auth.users"
        UUID tenant_id FK
        TEXT full_name
        TIMESTAMPTZ created_at
    }

    roles {
        INTEGER id PK
        UUID tenant_id FK "Nullable for global roles"
        TEXT name
    }

    user_roles {
        UUID user_id PK FK
        INTEGER role_id PK FK
        UUID tenant_id PK FK
    }

    news_articles {
        UUID id PK
        UUID tenant_id FK
        UUID author_id FK
        TEXT title
        TEXT content
        TIMESTAMPTZ created_at
    }

    employees {
        UUID id PK
        UUID user_profile_id FK
        UUID tenant_id FK
        UUID department_id FK
        DATE hire_date
    }

    departments {
        UUID id PK
        UUID tenant_id FK
        TEXT name
        UUID parent_department_id FK
    }

    workflows {
        UUID id PK
        UUID tenant_id FK
        TEXT name
        JSONB form_schema
        JSONB flow_definition
    }

    workflow_instances {
        UUID id PK
        UUID workflow_id FK
        UUID tenant_id FK
        UUID requester_id FK
        JSONB form_data
        TEXT current_status
    }

    tenants ||--o{ user_profiles : "has"
    tenants ||--o{ roles : "can define (tenant-specific)"
    tenants ||--o{ news_articles : "has"
    tenants ||--o{ employees : "has"
    tenants ||--o{ departments : "has"
    tenants ||--o{ workflows : "defines"
    tenants ||--o{ workflow_instances : "contains"

    user_profiles ||--o{ user_roles : "has"
    user_profiles ||--o{ news_articles : "authors"
    user_profiles ||--o{ employees : "is_an"  (one-to-one)
    user_profiles ||--o{ workflow_instances : "requests"

    roles ||--o{ user_roles : "assigned_to"

    departments ||--o{ employees : "contains"
    departments }o--o| departments : "parent_of (self-ref)"

    workflows ||--o{ workflow_instances : "has_many"

    %% Note: Some FKs like author_id in news_articles point to user_profiles
    %% RLS is a key aspect not fully represented in basic ERD but crucial.
```

*以上ERD为简化版，仅展示核心表和关系。*

## 5. 未来扩展

- **`audit_logs`:** 记录关键操作的审计日志。
- **`notifications`:** 存储系统通知。
- **`payment_info` / `subscriptions`:** 如果涉及付费订阅。
- 更多与具体业务模块相关的表。

本文档中的数据模型会随着项目需求的细化和迭代而更新。 
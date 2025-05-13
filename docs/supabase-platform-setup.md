# Supabase平台配置指南

本文档提供在Supabase平台上创建和配置项目的步骤，以支持SaaS-MIS应用的用户认证与授权系统。

## 1. 创建Supabase项目

1. 访问 [Supabase控制台](https://app.supabase.io/) 并登录
2. 点击 "New Project" 创建新项目
3. 选择组织（如无，先创建一个）
4. 填写项目详细信息：
   - 名称：`saas-mis`（或其他标识性名称）
   - 数据库密码：设置一个强密码并妥善保存
   - 地区：选择离您用户最近的地区
   - 价格方案：根据需求选择（开发可使用免费套餐）
5. 点击 "Create new project"

## 2. 应用数据库迁移

项目创建完成后，您需要应用我们预先定义的数据库迁移：

1. 在Supabase项目控制台，导航到 "SQL Editor"
2. 创建新查询
3. 将本地`supabase/migrations/20240320000000_initial_schema.sql`文件内容复制粘贴到编辑器
4. 点击 "Run" 执行迁移
5. 重复上述步骤执行`supabase/migrations/20240321000000_enhance_tenant_isolation.sql`

## 3. 配置认证设置

### 基本设置

1. 导航到 "Authentication" > "Settings"
2. 在 "Site URL" 中设置您的生产环境URL（开发环境可设置为`http://localhost:8848`）
3. 在 "Redirect URLs" 添加：
   - `http://localhost:8848/auth/callback`
   - `http://localhost:8848/auth/reset-password`
   - 生产环境中添加相应的URL

### 邮箱认证设置

1. 在 "Email Auth" 部分：
   - 启用 "Enable Email Signup"
   - 设置 "Confirm email" 为 "Enabled"（根据需求可调整）
   - 根据需要配置密码安全策略

### 第三方认证（可选）

如需添加第三方认证（如Google, GitHub等）：

1. 导航至相应的认证提供商部分
2. 启用并配置相应的密钥和重定向URL

## 4. 设置邮件模板

1. 导航到 "Authentication" > "Email Templates"
2. 根据需要定制以下电子邮件模板：
   - 邀请用户模板
   - 确认注册模板
   - 重置密码模板
   - 邮箱变更模板

模板示例：

### 确认注册模板

```html
<h2>确认您的注册</h2>
<p>感谢您注册SaaS-MIS系统。请点击下面的链接确认您的电子邮件地址：</p>
<p><a href="{{ .ConfirmationURL }}">确认邮箱地址</a></p>
<p>如果您没有注册此账户，请忽略此邮件。</p>
```

### 密码重置模板

```html
<h2>重置您的密码</h2>
<p>我们收到了重置密码的请求。请点击下面的链接重置您的密码：</p>
<p><a href="{{ .ConfirmationURL }}">重置密码</a></p>
<p>如果您没有请求重置密码，请忽略此邮件。</p>
```

## 5. 获取连接凭据

1. 导航到 "Settings" > "API"
2. 复制以下信息：
   - Project URL
   - anon key
   - service_role key (仅供后端或管理操作使用)

## 6. 配置环境变量

更新项目的`.env.development`文件（和其他环境文件）：

```
VITE_SUPABASE_URL=您的项目URL
VITE_SUPABASE_ANON_KEY=您的匿名密钥
```

对于需要管理员权限的操作（如直接数据库操作或用户管理），使用：

```
SUPABASE_SERVICE_ROLE_KEY=您的服务角色密钥
```

## 7. 创建初始租户和管理员用户

在Supabase控制台中执行以下SQL：

```sql
-- 创建默认租户
INSERT INTO tenants (name) VALUES ('Default Tenant');

-- 获取创建的租户ID
SELECT id FROM tenants WHERE name = 'Default Tenant';

-- 创建管理员用户（使用获取的租户ID）
INSERT INTO auth.users (
  instance_id, 
  id, 
  email, 
  encrypted_password, 
  email_confirmed_at, 
  raw_user_meta_data
) VALUES (
  -- 查询并替换实例ID
  (SELECT instance_id FROM auth.users LIMIT 1), 
  -- 生成UUID
  uuid_generate_v4(), 
  'admin@example.com', 
  -- 替换为加密密码
  crypt('SecurePassword123', gen_salt('bf')), 
  now(), 
  -- 替换为tenant_id
  jsonb_build_object('tenant_id', '替换为租户ID', 'role', 'super_admin')
);
```

## 8. 验证配置

1. 使用API测试功能验证认证流程
2. 确认初始用户可以成功登录
3. 验证RLS策略的有效性

## 故障排除

- **JWT认证问题**：检查站点URL和重定向URL配置
- **RLS策略不生效**：确认SQL迁移正确执行，检查用户是否有正确的`tenant_id`
- **邮件未发送**：检查邮件提供商配置和模板

## 下一步

完成平台配置后，继续进行前端认证组件的开发，包括登录、注册和密码重置页面。 
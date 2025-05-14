-- 创建初始租户
INSERT INTO tenants (name) 
VALUES ('Default') 
ON CONFLICT DO NOTHING
RETURNING *;

-- 注意: 以下插入需要在 auth.users 中创建用户后才能执行
-- 创建超级管理员用户的配置文件（需要先在 auth.users 中创建该用户）
-- INSERT INTO profiles (id, tenant_id, display_name, role)
-- VALUES (
--   '用户UUID', -- 替换为实际创建的用户ID
--   (SELECT id FROM tenants WHERE name = 'Default'), 
--   'Admin User',
--   'super_admin'
-- )
-- ON CONFLICT DO NOTHING; 
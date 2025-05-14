-- 最简单的密码重置迁移
DO $$
DECLARE
    admin_email TEXT := 'admin@example.com';
    simple_password TEXT := 'Admin123456'; -- 简单的纯字母数字密码
    admin_id UUID;
    found_user BOOLEAN;
BEGIN
    -- 检查用户是否存在
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = admin_email) INTO found_user;
    
    IF NOT found_user THEN
        RAISE EXCEPTION '管理员用户不存在，请先创建用户';
    END IF;
    
    -- 获取用户ID
    SELECT id INTO admin_id FROM auth.users WHERE email = admin_email;
    
    -- 使用最简单的方式更新密码
    UPDATE auth.users
    SET 
        encrypted_password = crypt(simple_password, gen_salt('bf')),
        updated_at = NOW()
    WHERE id = admin_id;
    
    -- 确保RLS策略被禁用
    ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.tenants DISABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE '管理员用户密码已重置：';
    RAISE NOTICE '  邮箱: %', admin_email;
    RAISE NOTICE '  新密码: %', simple_password;
    RAISE NOTICE '  ID: %', admin_id;
    
    -- 这是登录尝试的最简单密码
    -- 如果仍然失败，建议在Supabase控制台中手动创建用户
    RAISE NOTICE '登录建议：';
    RAISE NOTICE '  1. 删除所有浏览器cookies和本地存储';
    RAISE NOTICE '  2. 使用无痕窗口访问';
    RAISE NOTICE '  3. 手动输入密码，不要复制粘贴';
    RAISE NOTICE '  4. 确认VITE_SUPABASE_URL和VITE_SUPABASE_ANON_KEY正确配置';
END $$; 
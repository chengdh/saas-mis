-- 最终解决认证问题的迁移文件
DO $$
DECLARE
    admin_email TEXT := 'admin@example.com';
    admin_password TEXT := 'Password1@3456';
    admin_id UUID;
    default_tenant_id UUID;
BEGIN
    -- 获取默认租户ID
    SELECT id INTO default_tenant_id FROM public.tenants WHERE name = 'Default';
    
    IF default_tenant_id IS NULL THEN
        RAISE EXCEPTION '默认租户不存在，请先创建默认租户';
    END IF;
    
    -- 查找现有用户
    SELECT id INTO admin_id FROM auth.users WHERE email = admin_email;
    
    -- 使用事务处理删除和创建
    IF admin_id IS NOT NULL THEN
        -- 不删除现有用户，而是更新它
        RAISE NOTICE '更新现有管理员用户 (ID: %)...', admin_id;
        
        -- 更新auth.users
        UPDATE auth.users
        SET 
            encrypted_password = crypt(admin_password, gen_salt('bf')),
            email_confirmed_at = NOW(),
            raw_user_meta_data = jsonb_build_object(
                'tenant_id', default_tenant_id::text,
                'role', 'super_admin'
            ),
            updated_at = NOW()
        WHERE id = admin_id;
        
        -- 更新profiles
        UPDATE public.profiles
        SET 
            tenant_id = default_tenant_id,
            role = 'super_admin',
            display_name = 'Administrator',
            updated_at = NOW()
        WHERE id = admin_id;
    ELSE
        -- 新建用户
        admin_id := uuid_generate_v4();
        
        RAISE NOTICE '创建新管理员用户 (ID: %)...', admin_id;
        
        -- 插入到auth.users
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data
        ) VALUES (
            admin_id,
            (SELECT instance_id FROM auth.users WHERE instance_id IS NOT NULL LIMIT 1),
            admin_email,
            crypt(admin_password, gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            jsonb_build_object(
                'tenant_id', default_tenant_id::text,
                'role', 'super_admin'
            )
        );
        
        -- 插入到profiles
        INSERT INTO public.profiles (
            id, 
            tenant_id, 
            display_name, 
            role,
            created_at,
            updated_at
        ) VALUES (
            admin_id,
            default_tenant_id,
            'Administrator',
            'super_admin',
            NOW(),
            NOW()
        );
    END IF;
    
    -- 确保RLS策略被禁用
    ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.tenants DISABLE ROW LEVEL SECURITY;
    
    -- 输出用户信息
    RAISE NOTICE '管理员用户配置完成：';
    RAISE NOTICE '  ID: %', admin_id;
    RAISE NOTICE '  邮箱: %', admin_email;
    RAISE NOTICE '  密码: %', admin_password;
    RAISE NOTICE '  租户ID: %', default_tenant_id;
    
    -- 特别提示
    RAISE NOTICE '登录特别提示：';
    RAISE NOTICE '  1. 请尝试使用无痕模式/隐私窗口访问应用';
    RAISE NOTICE '  2. 确保VITE_SUPABASE_ANON_KEY环境变量正确';
    RAISE NOTICE '  3. 密码输入时避免复制/粘贴特殊字符';
    RAISE NOTICE '  4. 登录失败时查看浏览器控制台网络请求错误';
END $$; 
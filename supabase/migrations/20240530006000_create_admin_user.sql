-- 创建管理员用户的迁移文件
DO $$
DECLARE
    tenant_id UUID;
    admin_id UUID := uuid_generate_v4();
    admin_email TEXT := 'admin@example.com';
    admin_password TEXT := 'SecurePassword123';
    has_user BOOLEAN;
BEGIN
    -- 检查用户是否已存在
    SELECT EXISTS (
        SELECT 1 FROM auth.users WHERE email = admin_email
    ) INTO has_user;
    
    IF has_user THEN
        RAISE NOTICE 'Admin user with email % already exists, skipping creation', admin_email;
        RETURN;
    END IF;

    -- 获取默认租户ID
    SELECT id INTO tenant_id FROM public.tenants WHERE name = 'Default';
    
    IF tenant_id IS NULL THEN
        RAISE EXCEPTION 'Default tenant not found, please ensure it exists before creating admin user';
    END IF;
    
    -- 创建管理员用户
    INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_user_meta_data,
        created_at,
        updated_at
    ) VALUES (
        admin_id,
        admin_email,
        crypt(admin_password, gen_salt('bf')),
        now(),
        jsonb_build_object('tenant_id', tenant_id::text, 'role', 'super_admin'),
        now(),
        now()
    );
    
    -- 检查profiles是否通过触发器创建
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = admin_id) THEN
        RAISE NOTICE 'Manually creating profile for admin user';
        
        INSERT INTO public.profiles (id, tenant_id, role, display_name)
        VALUES (
            admin_id,
            tenant_id,
            'super_admin',
            'Admin User'
        );
    END IF;
    
    RAISE NOTICE 'Admin user created successfully with email: % and ID: %', admin_email, admin_id;
END $$; 
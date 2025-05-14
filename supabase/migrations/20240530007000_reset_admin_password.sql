-- 重置管理员用户密码迁移文件
DO $$
DECLARE
    admin_exists BOOLEAN;
    admin_id UUID;
    admin_email TEXT := 'admin@example.com';
    new_password TEXT := 'Admin123456!'; -- 使用简单但符合规则的密码
BEGIN
    -- 检查管理员用户是否存在
    SELECT 
        EXISTS(SELECT 1 FROM auth.users WHERE email = admin_email),
        id
    INTO 
        admin_exists,
        admin_id
    FROM auth.users 
    WHERE email = admin_email;
    
    IF admin_exists THEN
        -- 更新密码
        UPDATE auth.users 
        SET 
            encrypted_password = crypt(new_password, gen_salt('bf')),
            updated_at = now()
        WHERE email = admin_email;
        
        RAISE NOTICE '管理员用户 % 密码已重置为: %', admin_email, new_password;
    ELSE
        -- 创建管理员用户
        RAISE NOTICE '管理员用户不存在，将创建新用户';
        
        -- 获取默认租户ID
        DECLARE tenant_id UUID;
        BEGIN
            SELECT id INTO tenant_id FROM public.tenants WHERE name = 'Default';
            
            IF tenant_id IS NULL THEN
                RAISE EXCEPTION '默认租户不存在，请先创建租户';
            END IF;
            
            -- 创建新管理员
            INSERT INTO auth.users (
                id,
                email,
                encrypted_password,
                email_confirmed_at,
                raw_user_meta_data,
                created_at,
                updated_at
            ) VALUES (
                uuid_generate_v4(),
                admin_email,
                crypt(new_password, gen_salt('bf')),
                now(),
                jsonb_build_object('tenant_id', tenant_id::text, 'role', 'super_admin'),
                now(),
                now()
            )
            RETURNING id INTO admin_id;
            
            -- 确保profiles记录创建
            IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = admin_id) THEN
                INSERT INTO public.profiles (id, tenant_id, role, display_name)
                VALUES (
                    admin_id,
                    tenant_id,
                    'super_admin',
                    'Admin User'
                );
            END IF;
            
            RAISE NOTICE '新管理员用户已创建，邮箱: %，密码: %', admin_email, new_password;
        END;
    END IF;
END $$; 
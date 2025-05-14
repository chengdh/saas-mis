-- 检查管理员用户状态
DO $$
DECLARE
    admin_email TEXT := 'admin@example.com';
    admin_record RECORD;
    profile_record RECORD;
BEGIN
    -- 检查auth.users表中的管理员用户
    SELECT id, email, email_confirmed_at, confirmed_at, raw_user_meta_data, updated_at
    INTO admin_record
    FROM auth.users 
    WHERE email = admin_email;
    
    IF admin_record IS NULL THEN
        RAISE NOTICE '数据库中不存在邮箱为 % 的用户', admin_email;
        RETURN;
    END IF;
    
    -- 输出用户信息
    RAISE NOTICE '管理员用户信息:';
    RAISE NOTICE '  ID: %', admin_record.id;
    RAISE NOTICE '  邮箱: %', admin_record.email;
    RAISE NOTICE '  邮箱确认状态: %', COALESCE(admin_record.email_confirmed_at::text, 'NULL');
    RAISE NOTICE '  confirmed_at: %', COALESCE(admin_record.confirmed_at::text, 'NULL');
    RAISE NOTICE '  元数据: %', admin_record.raw_user_meta_data;
    RAISE NOTICE '  更新时间: %', admin_record.updated_at;
    
    -- 检查profiles表中的记录
    SELECT id, tenant_id, role, display_name
    INTO profile_record
    FROM public.profiles
    WHERE id = admin_record.id;
    
    IF profile_record IS NULL THEN
        RAISE NOTICE '不存在此用户的profile记录';
    ELSE
        RAISE NOTICE '用户profile记录:';
        RAISE NOTICE '  租户ID: %', profile_record.tenant_id;
        RAISE NOTICE '  角色: %', profile_record.role;
        RAISE NOTICE '  显示名称: %', profile_record.display_name;
    END IF;
    
    -- 检查邮箱确认状态，如果未确认，则确认
    IF admin_record.email_confirmed_at IS NULL THEN
        RAISE NOTICE '用户邮箱未确认，将自动确认...';
        
        UPDATE auth.users
        SET email_confirmed_at = now(), 
            confirmed_at = now(),
            updated_at = now()
        WHERE id = admin_record.id;
        
        RAISE NOTICE '邮箱已确认';
    END IF;
END $$; 
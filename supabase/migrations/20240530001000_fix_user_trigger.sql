-- 重新创建用户创建触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 确保 handle_new_user 函数存在
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, tenant_id, display_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'tenant_id', (SELECT id FROM public.tenants WHERE name = 'Default'))::uuid,
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'member')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 临时禁用 RLS 以允许创建初始用户
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
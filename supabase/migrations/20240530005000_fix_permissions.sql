-- 临时禁用所有相关表的RLS
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants DISABLE ROW LEVEL SECURITY;

-- 明确设置搜索路径，确保包含public schema
SET search_path TO public, auth, extensions;

-- 对触发器函数进行修复，明确指定schema
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, tenant_id, role, display_name)
    VALUES (
        NEW.id,
        (NEW.raw_user_meta_data->>'tenant_id')::uuid,
        COALESCE(NEW.raw_user_meta_data->>'role', 'member'),
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 重新创建触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 确保默认租户存在
INSERT INTO public.tenants (name) 
VALUES ('Default') 
ON CONFLICT (name) DO NOTHING; 
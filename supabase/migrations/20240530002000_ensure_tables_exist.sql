-- 确保tenants表存在
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 添加唯一约束（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tenants_name_key'
    ) THEN
        ALTER TABLE public.tenants ADD CONSTRAINT tenants_name_key UNIQUE (name);
    END IF;
END
$$;

-- 确保已创建默认租户
INSERT INTO public.tenants (name) 
VALUES ('Default') 
ON CONFLICT (name) DO NOTHING;

-- 确保表存在日志
DO $$
BEGIN
    RAISE NOTICE 'Ensuring tenants table exists with Default tenant';
END $$; 
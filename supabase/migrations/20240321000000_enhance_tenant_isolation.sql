-- Add additional RLS policies for tenants table
CREATE POLICY "Tenants are insertable by authenticated users"
    ON tenants FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Tenants are updatable by users within the same tenant"
    ON tenants FOR UPDATE
    USING (
        id IN (
            SELECT tenant_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- Add additional RLS policies for profiles table
CREATE POLICY "Users can insert profiles within their tenant"
    ON profiles FOR INSERT
    WITH CHECK (
        tenant_id IN (
            SELECT tenant_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own profile"
    ON profiles FOR DELETE
    USING (id = auth.uid());

-- Create a function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'super_admin'
    );
END;
$$;

-- Add super admin policies
CREATE POLICY "Super admins can view all tenants"
    ON tenants FOR SELECT
    USING (is_super_admin());

CREATE POLICY "Super admins can view all profiles"
    ON profiles FOR SELECT
    USING (is_super_admin());

-- Create a function to get current user's role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM profiles 
        WHERE id = auth.uid()
    );
END;
$$;

-- Add JWT claims
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, tenant_id, role)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'tenant_id',
        COALESCE(NEW.raw_user_meta_data->>'role', 'member')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Add RLS policies for future tables
CREATE OR REPLACE FUNCTION create_tenant_aware_table(
    table_name TEXT,
    additional_columns TEXT DEFAULT ''
)
RETURNS VOID AS $$
BEGIN
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id UUID NOT NULL REFERENCES tenants(id),
            %s
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        ALTER TABLE %I ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view records within their tenant"
            ON %I FOR SELECT
            USING (
                tenant_id IN (
                    SELECT tenant_id 
                    FROM profiles 
                    WHERE id = auth.uid()
                )
            );
            
        CREATE POLICY "Users can insert records within their tenant"
            ON %I FOR INSERT
            WITH CHECK (
                tenant_id IN (
                    SELECT tenant_id 
                    FROM profiles 
                    WHERE id = auth.uid()
                )
            );
            
        CREATE POLICY "Users can update records within their tenant"
            ON %I FOR UPDATE
            USING (
                tenant_id IN (
                    SELECT tenant_id 
                    FROM profiles 
                    WHERE id = auth.uid()
                )
            );
            
        CREATE POLICY "Users can delete records within their tenant"
            ON %I FOR DELETE
            USING (
                tenant_id IN (
                    SELECT tenant_id 
                    FROM profiles 
                    WHERE id = auth.uid()
                )
            );
            
        CREATE TRIGGER update_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    ', table_name, additional_columns, table_name, table_name, table_name, table_name, table_name);
END;
$$ LANGUAGE plpgsql; 
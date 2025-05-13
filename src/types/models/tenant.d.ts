export interface Tenant {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  tenant_id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'member' | 'admin' | 'super_admin';

export interface TenantAwareEntity {
  id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface TenantContext {
  currentTenant: Tenant | null;
  currentUserRole: UserRole | null;
  isSuperAdmin: boolean;
  isLoading: boolean;
  error: Error | null;
} 
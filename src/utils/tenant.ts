import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

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

export async function getCurrentTenantId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  return profile?.tenant_id || null;
}

export async function getCurrentTenant(): Promise<Tenant | null> {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) return null;

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single();

  return tenant;
}

export async function getCurrentUserRole(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role || null;
}

export async function isSuperAdmin(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role === 'super_admin';
}

export async function createTenant(name: string): Promise<Tenant | null> {
  const { data: tenant, error } = await supabase
    .from('tenants')
    .insert([{ name }])
    .select()
    .single();

  if (error) {
    console.error('Error creating tenant:', error);
    return null;
  }

  return tenant;
}

export async function updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant | null> {
  const { data: tenant, error } = await supabase
    .from('tenants')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating tenant:', error);
    return null;
  }

  return tenant;
}

export async function getTenantUsers(tenantId: string): Promise<Profile[]> {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('Error fetching tenant users:', error);
    return [];
  }

  return profiles;
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Profile>
): Promise<Profile | null> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user profile:', error);
    return null;
  }

  return profile;
} 
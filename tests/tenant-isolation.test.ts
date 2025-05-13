import { createClient } from '@supabase/supabase-js';
import { expect, test, describe, beforeAll, afterAll } from 'vitest';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

describe('Tenant Isolation Tests', () => {
  let tenant1Id: string;
  let tenant2Id: string;
  let user1Id: string;
  let user2Id: string;
  let superAdminId: string;

  beforeAll(async () => {
    // Create test tenants
    const { data: tenant1 } = await supabase
      .from('tenants')
      .insert([{ name: 'Test Tenant 1' }])
      .select()
      .single();
    tenant1Id = tenant1.id;

    const { data: tenant2 } = await supabase
      .from('tenants')
      .insert([{ name: 'Test Tenant 2' }])
      .select()
      .single();
    tenant2Id = tenant2.id;

    // Create test users
    const { data: user1 } = await supabase.auth.signUp({
      email: 'test1@example.com',
      password: 'test123456',
      options: {
        data: {
          tenant_id: tenant1Id,
          role: 'member'
        }
      }
    });
    user1Id = user1.user?.id || '';

    const { data: user2 } = await supabase.auth.signUp({
      email: 'test2@example.com',
      password: 'test123456',
      options: {
        data: {
          tenant_id: tenant2Id,
          role: 'member'
        }
      }
    });
    user2Id = user2.user?.id || '';

    // Create super admin
    const { data: superAdmin } = await supabase.auth.signUp({
      email: 'admin@example.com',
      password: 'test123456',
      options: {
        data: {
          tenant_id: tenant1Id,
          role: 'super_admin'
        }
      }
    });
    superAdminId = superAdmin.user?.id || '';
  });

  afterAll(async () => {
    // Clean up test data
    await supabase.from('profiles').delete().in('id', [user1Id, user2Id, superAdminId]);
    await supabase.from('tenants').delete().in('id', [tenant1Id, tenant2Id]);
  });

  test('User can only access their own tenant data', async () => {
    // Sign in as user1
    await supabase.auth.signInWithPassword({
      email: 'test1@example.com',
      password: 'test123456'
    });

    // Try to access tenant1 data (should succeed)
    const { data: tenant1Data, error: tenant1Error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenant1Id)
      .single();
    
    expect(tenant1Error).toBeNull();
    expect(tenant1Data).toBeDefined();

    // Try to access tenant2 data (should fail)
    const { data: tenant2Data, error: tenant2Error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenant2Id)
      .single();
    
    expect(tenant2Error).toBeDefined();
    expect(tenant2Data).toBeNull();
  });

  test('Super admin can access all tenant data', async () => {
    // Sign in as super admin
    await supabase.auth.signInWithPassword({
      email: 'admin@example.com',
      password: 'test123456'
    });

    // Try to access tenant1 data (should succeed)
    const { data: tenant1Data, error: tenant1Error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenant1Id)
      .single();
    
    expect(tenant1Error).toBeNull();
    expect(tenant1Data).toBeDefined();

    // Try to access tenant2 data (should also succeed)
    const { data: tenant2Data, error: tenant2Error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenant2Id)
      .single();
    
    expect(tenant2Error).toBeNull();
    expect(tenant2Data).toBeDefined();
  });

  test('Users can only modify their own tenant data', async () => {
    // Sign in as user1
    await supabase.auth.signInWithPassword({
      email: 'test1@example.com',
      password: 'test123456'
    });

    // Try to update tenant1 (should succeed)
    const { data: update1Data, error: update1Error } = await supabase
      .from('tenants')
      .update({ name: 'Updated Tenant 1' })
      .eq('id', tenant1Id)
      .select()
      .single();
    
    expect(update1Error).toBeNull();
    expect(update1Data.name).toBe('Updated Tenant 1');

    // Try to update tenant2 (should fail)
    const { data: update2Data, error: update2Error } = await supabase
      .from('tenants')
      .update({ name: 'Updated Tenant 2' })
      .eq('id', tenant2Id)
      .select()
      .single();
    
    expect(update2Error).toBeDefined();
    expect(update2Data).toBeNull();
  });

  test('Users can only access profiles within their tenant', async () => {
    // Sign in as user1
    await supabase.auth.signInWithPassword({
      email: 'test1@example.com',
      password: 'test123456'
    });

    // Try to access user1's profile (should succeed)
    const { data: profile1Data, error: profile1Error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user1Id)
      .single();
    
    expect(profile1Error).toBeNull();
    expect(profile1Data).toBeDefined();

    // Try to access user2's profile (should fail)
    const { data: profile2Data, error: profile2Error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user2Id)
      .single();
    
    expect(profile2Error).toBeDefined();
    expect(profile2Data).toBeNull();
  });
}); 
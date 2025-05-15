import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { getSupabaseClient, resetSupabaseClient, supabase } from "@/utils/supabase";
import type { Session, User, AuthError } from "@supabase/supabase-js";
import { useUserStoreHook } from "@/store/modules/user";
import { storageLocal } from "@/store/utils";

// 新增：用户注册接口
export interface RegisterParams {
  email: string;
  password: string;
  tenantName: string;
}

export const useAuthStore = defineStore("auth", () => {
  // 状态
  const user = ref<User | null>(null);
  const session = ref<Session | null>(null);
  const isLoading = ref(false);
  const error = ref<AuthError | null>(null);
  
  // getter
  const isAuthenticated = computed(() => !!user.value);
  const userEmail = computed(() => user.value?.email || "");
  const userTenantId = computed(() => user.value?.user_metadata?.tenant_id || null);
  
  // actions
  async function initialize() {
    const supabase = getSupabaseClient();
    
    // 获取当前会话
    const { data, error: sessionError } = await supabase.auth.getSession();
    
    // 处理获取会话错误
    if (sessionError) {
      console.error("获取会话失败:", sessionError);
      resetUserStore();
      return;
    }
    
    if (data.session) {
      session.value = data.session;
      user.value = data.session.user;
      updateUserStore(data.session.user);
    } else {
      // 无有效会话
      resetUserStore();
    }
    
    // 监听认证状态变化
    const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("Auth state changed:", event);
      session.value = newSession;
      user.value = newSession?.user || null;
      
      if (event === 'SIGNED_IN' && newSession?.user) {
        updateUserStore(newSession.user);
      } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        resetUserStore();
      } else if (event === 'TOKEN_REFRESHED' && newSession) {
        // 刷新令牌时更新会话
        session.value = newSession;
      }
    });
    
    // 返回取消监听函数，可以在组件卸载时使用
    return () => {
      authListener.subscription.unsubscribe();
    };
  }
  
  // 新增：用户注册函数
  async function register({ email, password, tenantName }: RegisterParams) {
    isLoading.value = true;
    error.value = null;
    
    try {
      // 第一步：创建新租户
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert([{ name: tenantName }])
        .select()
        .single();
      
      if (tenantError) {
        error.value = tenantError as unknown as AuthError;
        return { success: false, error: tenantError };
      }
      
      // 第二步：使用租户ID注册用户
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            tenant_id: tenant.id,
            role: 'admin', // 第一个注册的用户成为租户管理员
          },
          emailRedirectTo: `${window.location.origin}/auth/verify-email`
        }
      });
      
      if (signUpError) {
        // 如果用户注册失败，删除已创建的租户
        await supabase
          .from('tenants')
          .delete()
          .eq('id', tenant.id);
        
        error.value = signUpError;
        return { success: false, error: signUpError };
      }
      
      return { 
        success: true, 
        data,
        message: "注册成功！请查收邮箱并点击验证链接完成注册。"
      };
    } catch (err) {
      console.error("Registration error:", err);
      const authError = err as AuthError;
      error.value = authError;
      return { success: false, error: authError };
    } finally {
      isLoading.value = false;
    }
  }
  
  async function signIn(email: string, password: string, rememberMe: boolean = false) {
    isLoading.value = true;
    error.value = null;
    
    try {
      const supabase = getSupabaseClient();
      
      // 设置会话持久化选项
      const options = {
        auth: {
          // 根据记住我选项确定是否持久化会话
          persistSession: rememberMe,
          // 记住我时使用较长的过期时间，否则会话仅在当前浏览器窗口有效
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      };
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      }, options);
      
      if (signInError) {
        error.value = signInError;
        return { success: false, error: signInError };
      }
      
      if (!data.session) {
        const noSessionError = new Error("登录成功但未获取到会话") as AuthError;
        error.value = noSessionError;
        return { success: false, error: noSessionError };
      }
      
      session.value = data.session;
      user.value = data.user;
      
      if (data.user) {
        updateUserStore(data.user);
      }
      
      return { success: true, data };
    } catch (err) {
      console.error("Sign in error:", err);
      const authError = err as AuthError;
      error.value = authError;
      return { success: false, error: authError };
    } finally {
      isLoading.value = false;
    }
  }
  
  async function signOut() {
    isLoading.value = true;
    error.value = null;
    
    try {
      const supabase = getSupabaseClient();
      const { error: signOutError } = await supabase.auth.signOut({
        scope: 'local' // 只在当前设备登出
      });
      
      if (signOutError) {
        error.value = signOutError;
        return { success: false, error: signOutError };
      }
      
      session.value = null;
      user.value = null;
      resetUserStore();
      resetSupabaseClient();
      
      return { success: true };
    } catch (err) {
      console.error("Sign out error:", err);
      const authError = err as AuthError;
      error.value = authError;
      return { success: false, error: authError };
    } finally {
      isLoading.value = false;
    }
  }
  
  // 检查会话是否已过期
  function isSessionExpired(): boolean {
    if (!session.value?.expires_at) return true;
    
    // expires_at 是以秒为单位的时间戳
    const expiryTime = session.value.expires_at * 1000; // 转换为毫秒
    return Date.now() >= expiryTime;
  }
  
  // 刷新token
  async function refreshToken() {
    if (!session.value) return { success: false };
    
    isLoading.value = true;
    
    try {
      const supabase = getSupabaseClient();
      const { data, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error("刷新令牌失败:", refreshError);
        return { success: false, error: refreshError };
      }
      
      if (data.session) {
        session.value = data.session;
        return { success: true };
      }
      
      return { success: false };
    } catch (err) {
      console.error("刷新令牌错误:", err);
      return { success: false, error: err };
    } finally {
      isLoading.value = false;
    }
  }
  
  function updateUserStore(user: User) {
    const userStore = useUserStoreHook();
    
    // 更新用户名和角色
    userStore.setUsername(user.email || "");
    // 设置用户角色，默认为普通用户，如果有角色信息则使用实际角色
    userStore.setRoles(user.user_metadata?.role ? [user.user_metadata.role] : ['user']);
    
    // 存储租户ID
    if (user.user_metadata?.tenant_id) {
      userStore.setTenantId(user.user_metadata.tenant_id);
      // 保存到本地存储，以便在刷新页面后恢复
      storageLocal().setItem('tenantId', user.user_metadata.tenant_id);
    }
  }
  
  function resetUserStore() {
    const userStore = useUserStoreHook();
    userStore.SET_USERNAME("");
    userStore.SET_ROLES([]);
    storageLocal().removeItem('tenantId');
  }
  
  // 重置密码邮件发送
  async function resetPasswordForEmail(email: string) {
    isLoading.value = true;
    error.value = null;
    
    try {
      const supabase = getSupabaseClient();
      
      const { data, error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });
      
      if (resetError) {
        error.value = resetError;
        return { success: false, error: resetError };
      }
      
      return { 
        success: true, 
        data,
        message: "重置密码邮件已发送，请查收邮箱并按照提示操作"
      };
    } catch (err) {
      console.error("发送重置密码邮件错误:", err);
      const authError = err as AuthError;
      error.value = authError;
      return { success: false, error: authError };
    } finally {
      isLoading.value = false;
    }
  }
  
  return {
    user,
    session,
    isLoading,
    error,
    isAuthenticated,
    userEmail,
    userTenantId,
    initialize,
    register,
    signIn,
    signOut,
    isSessionExpired,
    refreshToken,
    resetPasswordForEmail
  };
});

export function useAuthStoreHook() {
  return useAuthStore();
} 
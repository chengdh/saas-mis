import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { getSupabaseClient, resetSupabaseClient } from "@/utils/supabase";
import type { Session, User, AuthError } from "@supabase/supabase-js";
import { useUserStoreHook } from "@/store/modules/user";
import { storageLocal } from "@/store/utils";

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
    userStore.SET_USERNAME(user.email || "");
    
    // 更新用户信息
    if (user.user_metadata) {
      if (user.user_metadata.avatar) {
        userStore.SET_AVATAR(user.user_metadata.avatar);
      }
      if (user.user_metadata.nickname) {
        userStore.SET_NICKNAME(user.user_metadata.nickname);
      }
    }
    
    // 设置角色
    const roles = user.app_metadata?.roles || [];
    userStore.SET_ROLES(roles);
    
    // 设置权限
    const permissions = user.app_metadata?.permissions || [];
    userStore.SET_PERMS(permissions);
    
    // 存储用户信息到本地存储
    const localUserData = {
      id: user.id,
      email: user.email,
      username: user.email,
      avatar: user.user_metadata?.avatar || "",
      nickname: user.user_metadata?.nickname || "",
      roles: roles,
      permissions: permissions,
      tenant_id: user.user_metadata?.tenant_id || null
    };
    
    storageLocal().setItem("user-info", localUserData);
  }
  
  function resetUserStore() {
    const userStore = useUserStoreHook();
    userStore.SET_USERNAME("");
    userStore.SET_AVATAR("");
    userStore.SET_NICKNAME("");
    userStore.SET_ROLES([]);
    userStore.SET_PERMS([]);
    
    // 清除本地存储的用户信息
    storageLocal().removeItem("user-info");
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
    signIn,
    signOut,
    isSessionExpired,
    refreshToken,
    updateUserStore,
    resetUserStore
  };
});

export function useAuthStoreHook() {
  return useAuthStore();
} 
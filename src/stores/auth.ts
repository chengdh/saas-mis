import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { getSupabaseClient, resetSupabaseClient } from "@/utils/supabase";
import type { Session, User, AuthError } from "@supabase/supabase-js";
import { useUserStoreHook } from "./modules/user";
import { storageLocal } from "./utils";

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
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      session.value = data.session;
      user.value = data.session.user;
      updateUserStore(data.session.user);
    }
    
    // 监听认证状态变化
    supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("Auth state changed:", event);
      session.value = newSession;
      user.value = newSession?.user || null;
      
      if (event === 'SIGNED_IN' && newSession?.user) {
        updateUserStore(newSession.user);
      } else if (event === 'SIGNED_OUT') {
        resetUserStore();
      }
    });
  }
  
  async function signIn(email: string, password: string) {
    isLoading.value = true;
    error.value = null;
    
    try {
      const supabase = getSupabaseClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (signInError) {
        error.value = signInError;
        return { success: false, error: signInError };
      }
      
      session.value = data.session;
      user.value = data.user;
      
      if (data.user) {
        updateUserStore(data.user);
      }
      
      return { success: true, data };
    } catch (err) {
      console.error("Sign in error:", err);
      error.value = err as AuthError;
      return { success: false, error: err };
    } finally {
      isLoading.value = false;
    }
  }
  
  async function signOut() {
    isLoading.value = true;
    error.value = null;
    
    try {
      const supabase = getSupabaseClient();
      const { error: signOutError } = await supabase.auth.signOut();
      
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
      error.value = err as AuthError;
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
    updateUserStore,
    resetUserStore
  };
});

export function useAuthStoreHook() {
  return useAuthStore();
} 
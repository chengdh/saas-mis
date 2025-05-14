<template>
  <el-config-provider :locale="currentLocale">
    <router-view />
    <ReDialog />
  </el-config-provider>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from "vue";
import { ElConfigProvider } from "element-plus";
import { ReDialog } from "@/components/ReDialog";
import { useAuthStoreHook } from "@/stores/auth";
import { useRouter } from "vue-router";
import { message } from "@/utils/message";
import zhCn from "element-plus/es/locale/lang/zh-cn";

// 加载本地化配置
const currentLocale = zhCn;
const router = useRouter();
let sessionCheckInterval: number | null = null;

// 在应用启动时初始化认证状态
onMounted(async () => {
  const authStore = useAuthStoreHook();
  const cleanup = await authStore.initialize();
  
  // 定期检查会话是否过期
  sessionCheckInterval = window.setInterval(async () => {
    // 只有在用户已登录时才检查
    if (authStore.isAuthenticated) {
      // 会话即将过期时尝试刷新
      if (authStore.session?.expires_at) {
        // 提前5分钟刷新(300秒)
        const expiryTime = authStore.session.expires_at * 1000;
        const timeUntilExpiry = expiryTime - Date.now();
        
        // 如果即将过期(5分钟内)，尝试刷新token
        if (timeUntilExpiry < 300000 && timeUntilExpiry > 0) {
          console.log("会话即将过期，尝试刷新令牌");
          const { success } = await authStore.refreshToken();
          if (!success) {
            console.warn("自动刷新令牌失败");
          }
        }
        
        // 如果已过期，退出登录并提示用户
        if (authStore.isSessionExpired()) {
          console.warn("会话已过期");
          authStore.signOut();
          message("登录已过期，请重新登录", { type: "warning" });
          router.push("/login");
        }
      }
    }
  }, 60000); // 每分钟检查一次
  
  // 在组件卸载时清理
  onBeforeUnmount(() => {
    if (typeof cleanup === 'function') {
      cleanup(); // 取消认证状态监听
    }
    if (sessionCheckInterval !== null) {
      clearInterval(sessionCheckInterval);
      sessionCheckInterval = null;
    }
  });
});
</script>

<template>
  <el-config-provider :locale="currentLocale">
    <router-view />
    <ReDialog />
  </el-config-provider>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { ElConfigProvider } from "element-plus";
import { ReDialog } from "@/components/ReDialog";
import { useAuthStoreHook } from "@/stores/auth";
import zhCn from "element-plus/es/locale/lang/zh-cn";

// 加载本地化配置
const currentLocale = zhCn;

// 在应用启动时初始化认证状态
onMounted(async () => {
  const authStore = useAuthStoreHook();
  await authStore.initialize();
});
</script>

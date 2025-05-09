// 导入所有store模块
import { useTenantStore } from "./modules/tenant";
import { useAppStore } from "./modules/app";
import { useUserStore } from "./modules/user";
import { useEpThemeStore } from "./modules/epTheme";
import { useSettingStore } from "./modules/settings";
import { useMultiTagsStore } from "./modules/multiTags";
import { usePermissionStore } from "./modules/permission";

// 确保所有store模块被加载
export function loadAllStores() {
  // 初始化所有store，确保它们被注册
  const stores = {
    app: useAppStore(),
    user: useUserStore(),
    tenant: useTenantStore(),
    epTheme: useEpThemeStore(), 
    settings: useSettingStore(),
    multiTags: useMultiTagsStore(),
    permission: usePermissionStore()
  };
  
  return stores;
} 
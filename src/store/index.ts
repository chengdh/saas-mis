import type { App } from "vue";
import { createPinia } from "pinia";
import { loadAllStores } from "./modules";

const store = createPinia();

export function setupStore(app: App<Element>) {
  app.use(store);
  
  // 确保所有store模块都被加载
  loadAllStores();
}

export { store };

import { defineStore } from "pinia";
import { store } from "@/store";
import { useStorage } from "@vueuse/core";

export interface TenantState {
  currentTenantId: string;
  tenants: Tenant[];
}

export interface Tenant {
  id: string;
  name: string;
}

export const useTenantStore = defineStore("pure-tenant", {
  state: () => ({
    // Store the current tenant ID in localStorage for persistence across sessions
    currentTenantId: useStorage("currentTenantId", "default"),
    // Mock data - in a real application, this would be populated from API
    tenants: [
      { id: "default", name: "默认租户" },
      { id: "tenant-a", name: "租户A" },
      { id: "tenant-b", name: "租户B" }
    ]
  }),
  getters: {
    getCurrentTenant() {
      return (
        this.tenants.find(tenant => tenant.id === this.currentTenantId) || 
        { id: "default", name: "默认租户" }
      );
    }
  },
  actions: {
    setCurrentTenant(tenantId) {
      if (this.tenants.some(tenant => tenant.id === tenantId)) {
        this.currentTenantId = tenantId;
        return true;
      }
      return false;
    },
    
    async fetchTenants() {
      try {
        // In a real application, this would fetch tenants from an API
        // const response = await api.getTenants();
        // this.tenants = response.data;
        
        // For now, we're just using the mock data
        console.log("Tenant list loaded (mock data)");
        return this.tenants;
      } catch (error) {
        console.error("Error fetching tenants:", error);
        return [];
      }
    }
  }
});

// Export a composable function to use the tenant store
export function useTenantStoreHook() {
  return useTenantStore(store);
} 
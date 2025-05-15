<script setup lang="ts">
import { useRouter } from "vue-router";
import { message } from "@/utils/message";
import { registerRules } from "./utils/rule";
import { ref, reactive, watch, onMounted, onUnmounted } from "vue";
import { debounce } from "@pureadmin/utils";
import type { FormInstance } from "element-plus";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { useAuthStoreHook } from "@/stores/auth";
import { bg, illustration } from "@/views/login/utils/static";
import { useNav } from "@/layout/hooks/useNav";

import dayIcon from "@/assets/svg/day.svg?component";
import darkIcon from "@/assets/svg/dark.svg?component";
import Lock from "~icons/ri/lock-fill";
import User from "~icons/ri/user-3-fill";
import Company from "~icons/ri/building-4-fill";

defineOptions({
  name: "Register"
});

const router = useRouter();
const loading = ref(false);
const ruleFormRef = ref<FormInstance>();
const authStore = useAuthStoreHook();
const agreeTerms = ref(false);

const { dataTheme, overallStyle, dataThemeChange } = useDataThemeChange();
dataThemeChange(overallStyle.value);
const { title } = useNav();

const ruleForm = reactive({
  email: "",
  tenantName: "",
  password: "",
  confirmPassword: ""
});

// 使用 watch 来监听密码变化
watch(
  () => ruleForm.password,
  (newVal, oldVal) => {
    if (ruleForm.confirmPassword && newVal !== oldVal) {
      // 如果已经输入确认密码，则在密码变更时重新验证
      ruleFormRef.value?.validateField("confirmPassword");
    }
  }
);

const onRegister = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate(valid => {
    if (valid) {
      if (!agreeTerms.value) {
        message("请阅读并同意用户协议和隐私政策", { type: "warning" });
        return;
      }

      loading.value = true;

      authStore
        .register({
          email: ruleForm.email,
          password: ruleForm.password,
          tenantName: ruleForm.tenantName
        })
        .then(({ success, error, message: msg }) => {
          if (!success && error) {
            // 更具体的错误信息
            if (error.message.includes("already registered")) {
              message("该邮箱已被注册", { type: "error" });
            } else if (error.message.includes("weak password")) {
              message("密码强度不足，请使用更复杂的密码", { type: "error" });
            } else {
              message(error.message || "注册失败", { type: "error" });
            }
            return;
          }

          // 注册成功
          message(msg || "注册成功！请查收邮箱并点击验证链接完成注册。", {
            type: "success"
          });

          // 延迟后跳转到登录页
          setTimeout(() => {
            router.push("/login");
          }, 2000);
        })
        .catch(err => {
          console.error("注册错误:", err);
          if (!navigator.onLine) {
            message("网络连接失败，请检查网络设置", { type: "error" });
          } else {
            message("注册失败，请稍后重试", { type: "error" });
          }
        })
        .finally(() => {
          loading.value = false;
        });
    }
  });
};

const immediateDebounce = debounce(
  () => onRegister(ruleFormRef.value),
  1000,
  true
);

// 使用原生事件监听器替代 useEventListener
const handleKeyDown = e => {
  if (["Enter", "NumpadEnter"].includes(e.code) && !loading.value) {
    immediateDebounce();
  }
};

// 在组件挂载时添加事件监听
onMounted(() => {
  document.addEventListener("keydown", handleKeyDown);
});

// 在组件卸载时移除事件监听
onUnmounted(() => {
  document.removeEventListener("keydown", handleKeyDown);
});

// 导航到登录页面
const goToLogin = () => {
  router.push("/login");
};

// 打开用户协议或隐私政策
const openAgreement = (type: "terms" | "privacy") => {
  console.log(`Opening ${type} agreement`);
  try {
    const url = type === "terms" ? "/terms.html" : "/privacy.html";
    window.open(url, "_blank");
  } catch (error) {
    console.error("打开协议页面失败:", error);
  }
};

// 添加处理复选框点击的方法
const handleCheckboxToggle = () => {
  agreeTerms.value = !agreeTerms.value;
  console.log("Checkbox toggled, new state:", agreeTerms.value);
};
</script>

<template>
  <div class="select-none">
    <img :src="bg" class="wave" />
    <div class="flex-c absolute right-5 top-3">
      <!-- 主题 -->
      <el-switch
        v-model="dataTheme"
        inline-prompt
        :active-icon="dayIcon"
        :inactive-icon="darkIcon"
        @change="dataThemeChange"
      />
    </div>
    <div class="login-container">
      <div class="img">
        <img
          v-if="!illustration"
          src="@/assets/login/illustration.svg"
          alt="登录插图"
        />
        <component :is="illustration" v-else />
      </div>
      <div class="login-box">
        <div class="login-form">
          <h2 class="outline-hidden">{{ title }} - 企业注册</h2>

          <el-form
            ref="ruleFormRef"
            :model="ruleForm"
            :rules="registerRules"
            size="large"
          >
            <el-form-item prop="email">
              <el-input
                v-model="ruleForm.email"
                clearable
                placeholder="请输入邮箱"
                :prefix-icon="useRenderIcon(User)"
              />
            </el-form-item>

            <el-form-item prop="tenantName">
              <el-input
                v-model="ruleForm.tenantName"
                clearable
                placeholder="请输入企业名称"
                :prefix-icon="useRenderIcon(Company)"
              />
            </el-form-item>

            <el-form-item prop="password">
              <el-input
                v-model="ruleForm.password"
                clearable
                show-password
                placeholder="请输入密码"
                :prefix-icon="useRenderIcon(Lock)"
              />
            </el-form-item>

            <el-form-item prop="confirmPassword">
              <el-input
                v-model="ruleForm.confirmPassword"
                clearable
                show-password
                placeholder="请确认密码"
                :prefix-icon="useRenderIcon(Lock)"
              />
            </el-form-item>

            <el-form-item class="mb-3">
              <div class="agreement-wrapper">
                <div
                  class="custom-checkbox-wrapper"
                  @click="handleCheckboxToggle"
                >
                  <el-checkbox
                    :model-value="agreeTerms"
                    class="agreement-checkbox"
                  >
                    我已阅读并同意
                  </el-checkbox>
                </div>
                <el-button
                  text
                  type="primary"
                  class="agreement-link"
                  @click.stop.prevent="openAgreement('terms')"
                  >《用户协议》</el-button
                >
                <span class="mx-1">和</span>
                <el-button
                  text
                  type="primary"
                  class="agreement-link"
                  @click.stop.prevent="openAgreement('privacy')"
                  >《隐私政策》</el-button
                >
              </div>
            </el-form-item>

            <el-button
              class="w-full register-btn"
              size="default"
              type="primary"
              :loading="loading"
              :disabled="loading"
              @click="onRegister(ruleFormRef)"
            >
              注册
            </el-button>

            <div class="flex justify-center mt-4">
              <span class="text-gray-500">已有账号？</span>
              <el-link
                type="primary"
                :underline="false"
                class="ml-1"
                @click="goToLogin"
                >返回登录</el-link
              >
            </div>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url("@/style/login.css");

.register-btn {
  display: block !important;
  opacity: 1 !important;
  visibility: visible !important;
}

.agreement-wrapper {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 10px;
  pointer-events: auto !important;
}

.custom-checkbox-wrapper {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  margin-right: 8px;
  padding: 2px 4px;
}

.agreement-checkbox {
  cursor: pointer !important;
  pointer-events: none; /* 禁用复选框自身的点击事件，由父元素处理 */
}

.agreement-link {
  color: var(--el-color-primary);
  font-size: 14px;
  text-decoration: none;
  cursor: pointer !important;
  margin: 0 2px;
  font-weight: normal;
  padding: 0;
  height: auto;
}

.el-form-item {
  margin-bottom: 22px;
}
</style>

<style lang="scss" scoped>
:deep(.el-input-group__append, .el-input-group__prepend) {
  padding: 0;
}

:deep(.el-checkbox) {
  height: auto;
  cursor: pointer;
}

:deep(.el-checkbox__input) {
  cursor: pointer;
}

:deep(.el-checkbox__label) {
  cursor: pointer;
}

/* 确保按钮元素样式正确 */
:deep(.el-button.agreement-link) {
  position: relative;
  z-index: 20;
  cursor: pointer !important;
  padding: 0;
  margin: 0 2px;
  height: auto;
  line-height: normal;
  border: none;
  display: inline-flex;
  align-items: center;
}

:deep(.el-button.agreement-link:hover) {
  color: var(--el-color-primary-light-3);
  background: transparent;
}

:deep(.el-button.agreement-link:focus) {
  outline: none;
  box-shadow: none;
}
</style>

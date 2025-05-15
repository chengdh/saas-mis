<script setup lang="ts">
import Motion from "./utils/motion";
import { useRouter } from "vue-router";
import { message } from "@/utils/message";
import { loginRules } from "./utils/rule";
import { ref, reactive, toRaw } from "vue";
import { debounce } from "@pureadmin/utils";
import { useNav } from "@/layout/hooks/useNav";
import { useEventListener } from "@vueuse/core";
import type { FormInstance } from "element-plus";
import { useLayout } from "@/layout/hooks/useLayout";
import { useUserStoreHook } from "@/store/modules/user";
import { useAuthStoreHook } from "@/stores/auth";
import { initRouter, getTopMenu } from "@/router/utils";
import { bg, avatar, illustration } from "./utils/static";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";

import dayIcon from "@/assets/svg/day.svg?component";
import darkIcon from "@/assets/svg/dark.svg?component";
import Lock from "~icons/ri/lock-fill";
import User from "~icons/ri/user-3-fill";

defineOptions({
  name: "Login"
});

const router = useRouter();
const loading = ref(false);
const ruleFormRef = ref<FormInstance>();
const authStore = useAuthStoreHook();
const rememberMe = ref(false);

const { initStorage } = useLayout();
initStorage();

const { dataTheme, overallStyle, dataThemeChange } = useDataThemeChange();
dataThemeChange(overallStyle.value);
const { title } = useNav();

const ruleForm = reactive({
  email: "",
  password: ""
});

const onLogin = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate(valid => {
    if (valid) {
      loading.value = true;

      authStore
        .signIn(ruleForm.email, ruleForm.password, rememberMe.value)
        .then(({ success, error }) => {
          if (!success && error) {
            // 更具体的错误信息
            if (error.message.includes("Invalid login credentials")) {
              message("邮箱或密码错误", { type: "error" });
            } else if (error.message.includes("Email not confirmed")) {
              message("邮箱未验证，请先验证邮箱", { type: "warning" });
            } else if (error.message.includes("rate limit")) {
              message("登录尝试次数过多，请稍后再试", { type: "error" });
            } else if (error.message.includes("User not found")) {
              message("用户不存在", { type: "error" });
            } else {
              message(error.message || "登录失败", { type: "error" });
            }
            return;
          }

          // 获取后端路由
          return initRouter()
            .then(() => {
              // 直接导航到欢迎页面
              return router.push("/");
            })
            .then(() => {
              message("登录成功", { type: "success" });
            })
            .catch(error => {
              console.error("路由处理错误:", error);
              // 如果导航失败，尝试导航到根路径
              return router.push("/").catch(err => {
                console.error("根路径导航也失败:", err);
              });
            });
        })
        .catch(err => {
          console.error("登录错误:", err);
          // 网络错误处理
          if (!navigator.onLine) {
            message("网络连接失败，请检查网络设置", { type: "error" });
          } else if (
            err.name === "NetworkError" ||
            err.message?.includes("network")
          ) {
            message("网络连接失败，请检查网络设置", { type: "error" });
          } else if (
            err.name === "TimeoutError" ||
            err.message?.includes("timeout")
          ) {
            message("请求超时，请稍后重试", { type: "error" });
          } else {
            message("登录失败，请稍后重试", { type: "error" });
          }
        })
        .finally(() => {
          loading.value = false;
        });
    }
  });
};

const immediateDebounce = debounce(
  (formRef: FormInstance | undefined) => onLogin(formRef),
  1000,
  true
);

useEventListener(document, "keydown", ({ code }) => {
  if (["Enter", "NumpadEnter"].includes(code) && !loading.value)
    immediateDebounce(ruleFormRef.value);
});

// 导航到注册页面
const goToRegister = () => {
  console.log("尝试导航到注册页面");
  router.push("/auth/register");
};

// 导航到忘记密码页面
const goToForgotPassword = () => {
  router.push("/auth/forgot-password");
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
        <component :is="toRaw(illustration)" />
      </div>
      <div class="login-box">
        <div class="login-form">
          <avatar class="avatar" />
          <Motion>
            <h2 class="outline-hidden">{{ title }}</h2>
          </Motion>

          <el-form
            ref="ruleFormRef"
            :model="ruleForm"
            :rules="loginRules"
            size="large"
          >
            <Motion :delay="100">
              <el-form-item prop="email">
                <el-input
                  v-model="ruleForm.email"
                  clearable
                  placeholder="邮箱"
                  :prefix-icon="useRenderIcon(User)"
                />
              </el-form-item>
            </Motion>

            <Motion :delay="150">
              <el-form-item prop="password">
                <el-input
                  v-model="ruleForm.password"
                  clearable
                  show-password
                  placeholder="密码"
                  :prefix-icon="useRenderIcon(Lock)"
                />
              </el-form-item>
            </Motion>

            <Motion :delay="200">
              <div class="flex justify-between">
                <el-checkbox v-model="rememberMe">记住我</el-checkbox>
                <el-link
                  type="primary"
                  :underline="false"
                  @click="goToForgotPassword"
                  >忘记密码？</el-link
                >
              </div>
            </Motion>

            <Motion :delay="250">
              <el-button
                class="w-full mt-4!"
                size="default"
                type="primary"
                :loading="loading"
                :disabled="loading"
                @click="onLogin(ruleFormRef)"
              >
                登录
              </el-button>
            </Motion>

            <Motion :delay="300">
              <div class="flex justify-center mt-4">
                <span class="text-gray-500">还没有账号？</span>
                <el-link
                  type="primary"
                  :underline="false"
                  class="ml-1"
                  @click="goToRegister"
                  >立即注册</el-link
                >
              </div>
            </Motion>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url("@/style/login.css");
</style>

<style lang="scss" scoped>
:deep(.el-input-group__append, .el-input-group__prepend) {
  padding: 0;
}
</style>

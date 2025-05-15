<script setup lang="ts">
import { useRouter } from "vue-router";
import { message } from "@/utils/message";
import { ref, reactive, onMounted, onUnmounted } from "vue";
import { debounce } from "@pureadmin/utils";
import type { FormInstance, FormRules } from "element-plus";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { useAuthStoreHook } from "@/stores/auth";
import { bg, illustration } from "@/views/login/utils/static";
import { useNav } from "@/layout/hooks/useNav";

import dayIcon from "@/assets/svg/day.svg?component";
import darkIcon from "@/assets/svg/dark.svg?component";
import User from "~icons/ri/user-3-fill";
import Mail from "~icons/ri/mail-line";

defineOptions({
  name: "ForgotPassword"
});

const router = useRouter();
const loading = ref(false);
const ruleFormRef = ref<FormInstance>();
const authStore = useAuthStoreHook();
const emailSent = ref(false);

const { dataTheme, overallStyle, dataThemeChange } = useDataThemeChange();
dataThemeChange(overallStyle.value);
const { title } = useNav();

const ruleForm = reactive({
  email: ""
});

// 表单验证规则
const rules = reactive<FormRules>({
  email: [
    {
      required: true,
      message: "请输入邮箱",
      trigger: "blur"
    },
    {
      type: "email",
      message: "请输入有效的邮箱地址",
      trigger: "blur"
    }
  ]
});

const onResetPassword = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate(valid => {
    if (valid) {
      loading.value = true;

      authStore
        .resetPasswordForEmail(ruleForm.email)
        .then(({ success, error, message: msg }) => {
          if (!success && error) {
            // 处理已知错误情况
            if (
              error.message?.includes("Invalid") ||
              error.message?.includes("email")
            ) {
              message("无效的邮箱地址，请检查后重试", { type: "error" });
            } else {
              message(error.message || "发送重置密码邮件失败", {
                type: "error"
              });
            }
            return;
          }

          // 发送成功
          message(msg || "重置密码邮件已发送，请查收邮箱并按照提示操作", {
            type: "success"
          });

          emailSent.value = true;

          // 不再自动跳转，让用户自行前往邮箱查收
        })
        .catch(err => {
          console.error("重置密码邮件发送错误:", err);
          if (!navigator.onLine) {
            message("网络连接失败，请检查网络设置", { type: "error" });
          } else {
            message("发送重置密码邮件失败，请稍后重试", { type: "error" });
          }
        })
        .finally(() => {
          loading.value = false;
        });
    }
  });
};

const immediateDebounce = debounce(
  () => {
    if (!loading.value && !emailSent.value) {
      onResetPassword(ruleFormRef.value);
    }
  },
  1000,
  true
);

// 使用原生事件监听器
const handleKeyDown = e => {
  if (
    ["Enter", "NumpadEnter"].includes(e.code) &&
    !loading.value &&
    !emailSent.value
  ) {
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

// 再次发送邮件
const resendEmail = () => {
  emailSent.value = false;
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
          <h2 class="outline-hidden">{{ title }} - 找回密码</h2>

          <template v-if="!emailSent">
            <p class="text-gray-500 mb-4">
              请输入您的账号邮箱，我们将发送密码重置链接到您的邮箱
            </p>

            <el-form
              ref="ruleFormRef"
              :model="ruleForm"
              :rules="rules"
              size="large"
            >
              <el-form-item prop="email">
                <el-input
                  v-model="ruleForm.email"
                  clearable
                  placeholder="请输入您的账号邮箱"
                  :prefix-icon="useRenderIcon(Mail)"
                  autocomplete="email"
                />
              </el-form-item>

              <el-button
                class="w-full reset-btn"
                size="default"
                type="primary"
                :loading="loading"
                :disabled="loading"
                @click="onResetPassword(ruleFormRef)"
              >
                发送重置密码邮件
              </el-button>
            </el-form>
          </template>

          <template v-else>
            <el-result
              icon="success"
              title="邮件已发送"
              sub-title="请查收您的邮箱，点击邮件中的链接重置密码。如果没有收到邮件，请检查垃圾邮件文件夹。"
            >
              <template #extra>
                <div class="flex flex-col gap-3">
                  <el-button type="primary" @click="resendEmail"
                    >再次发送</el-button
                  >
                  <el-button @click="goToLogin">返回登录</el-button>
                </div>
              </template>
            </el-result>
          </template>

          <div v-if="!emailSent" class="flex justify-center mt-4">
            <span class="text-gray-500">想起密码了？</span>
            <el-link
              type="primary"
              :underline="false"
              class="ml-1"
              @click="goToLogin"
              >返回登录</el-link
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url("@/style/login.css");

.reset-btn {
  display: block !important;
  opacity: 1 !important;
  visibility: visible !important;
}

.el-form-item {
  margin-bottom: 22px;
}
</style>

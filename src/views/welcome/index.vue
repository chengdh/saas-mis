<script setup lang="ts">
import { ref } from "vue";

defineOptions({
  name: "Welcome"
});

const title = ref("欢迎使用 SaaS MIS 系统");
</script>

<template>
  <div class="welcome-container">
    <h1>{{ title }}</h1>
    <div class="welcome-content">
      <p>您已成功登录系统</p>
    </div>
  </div>
</template>

<style scoped>
.welcome-container {
  padding: 20px;
  text-align: center;
}

.welcome-content {
  margin-top: 20px;
  font-size: 16px;
  color: #666;
}
</style>

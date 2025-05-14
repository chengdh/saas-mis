export default {
  path: "/welcome",
  name: "Welcome",
  component: () => import("@/views/welcome/index.vue"),
  meta: {
    title: "首页",
    icon: "home-filled",
    rank: 0,
    showLink: true
  }
} as const; 
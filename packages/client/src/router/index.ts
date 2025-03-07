import { loadPrivacyPolicy } from "@/utils/privacyPolicy";
import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "about-root",
      component: () => import("../views/root/AboutRoot.vue"),
      children: [
        {
          path: "",
          name: "about",
          component: () => import("../views/root/AboutView.vue"),
          meta: {
            title: "about - aurabloom",
          },
        },
        {
          path: "/login",
          name: "login",
          component: () => import("../views/root/AuthView.vue"),
          meta: {
            title: "log in - aurabloom",
            guest: true,
          },
        },
        {
          path: "/register",
          name: "register",
          component: () => import("../views/root/AuthView.vue"),
          meta: {
            title: "register - aurabloom",
            guest: true,
          },
        },
        {
          path: "/privacy",
          name: "privacy",
          component: () => import("../views/root/PrivacyView.vue"),
          meta: {
            title: "privacy policy - aurabloom",
          },
          beforeEnter: async (_to, _from, next) => {
            try {
              await loadPrivacyPolicy();
              next();
            } catch (error) {
              console.error("error loading privacy policy:", error);
              next();
            }
          },
        },
      ],
    },
  ],
});

router.beforeEach(async (to) => {
  document.title = (to.meta.title as string) || "aurabloom";
});

export default router;

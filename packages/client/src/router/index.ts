import { loadPrivacyPolicy } from "@/utils/privacyPolicy";
import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/about",
      name: "about-root",
      component: () => import("../views/about/AboutRoot.vue"),

      children: [
        {
          path: "",
          name: "about",
          component: () => import("../views/about/AboutView.vue"),
          meta: {
            title: "about - aurabloom",
          },
        },
        {
          path: "/about/privacy",
          name: "privacy",
          component: () => import("../views/about/PrivacyView.vue"),
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

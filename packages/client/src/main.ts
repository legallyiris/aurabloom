import "./assets/main.scss";

import type { App as AurabloomApp } from "@aurabloom/server";
import { treaty } from "@elysiajs/eden";

import { createPinia } from "pinia";
import { createApp } from "vue";

import App from "./App.vue";
import router from "./router";

const app = createApp(App);
app.config.globalProperties.$api = treaty<AurabloomApp>(
  "http://localhost:3000",
);

app.use(createPinia());
app.use(router);

app.mount("#app");

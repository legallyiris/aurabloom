import type { App as AurabloomApp } from "@aurabloom/server";
import { treaty } from "@elysiajs/eden";
import { ref } from "vue";

export const baseUrl = ref("http://localhost:3000");

export const api = treaty<AurabloomApp>(baseUrl.value, {
  fetch: {
    credentials: "include",
  },
});

export function setApiBaseUrl(url: string) {
  baseUrl.value = url;
  Object.assign(
    api,
    treaty<AurabloomApp>(url, {
      fetch: {
        credentials: "include",
      },
    }),
  );
}

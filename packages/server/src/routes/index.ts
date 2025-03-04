import fs from "node:fs";
import { Elysia } from "elysia";

import { authRoutes } from "./auth";
import { usersRoutes } from "./users";

const rootTxt = fs.readFileSync("assets/root.txt", "utf8");

export const routes = new Elysia()
  .get(
    "/",
    (app) => {
      const txt = rootTxt
        .replace("<DOCS_URL>", `${app.server?.url}docs`)
        .replace("<APP_URL>", `${app.server?.url}`);
      return txt;
    },
    {
      detail: {
        summary: "root",
        description: "root route",
        tags: ["api root"],
      },
    },
  )
  .use(usersRoutes)
  .use(authRoutes);

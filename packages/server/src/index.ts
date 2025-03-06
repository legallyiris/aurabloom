import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { Logger } from "common";
import { Elysia } from "elysia";

import cfg from "./config";

import { routes } from "./routes";
import { apiError } from "./utils/apiError";

const appLogger = new Logger("app");

async function startServer() {
  const app = new Elysia({
    cookie: {
      secrets: [cfg.cookie.secret],
      path: cfg.cookie.path,
      httpOnly: cfg.cookie.httpOnly,
      secure: cfg.server.secure,
      sameSite: cfg.cookie.sameSite,
      sign: ["session"],
    },
  })
    .use(cors())
    .use(swagger({ path: "/api/docs" }))
    .onError(({ error, code }) => {
      if (code === "NOT_FOUND") return apiError(404, "Not Found");
      if (code === "VALIDATION") return apiError(400, "Validation Error");
      if (code === "INVALID_COOKIE_SIGNATURE")
        return apiError(403, "Invalid Cookie Signature");
      if (code === "INTERNAL_SERVER_ERROR")
        return apiError(500, "Internal Server Error");
      if (code === "PARSE") return apiError(400, "Invalid Request");

      appLogger.error(`${code} ${error}`);
      return apiError(500, "Internal Server Error");
    })
    .group("/api", (app) => {
      return app.use(routes);
    })
    .listen(cfg.server.port);

  appLogger.info(
    `${cfg.app.fullName} v${cfg.app.version} is running at ${app.server?.hostname}:${app.server?.port}`,
  );
}

startServer();
export type { App } from "./eden";

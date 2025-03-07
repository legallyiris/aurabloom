import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { Logger } from "common";
import { Elysia } from "elysia";

import cfg from "./config";

import { routes } from "./routes";
import { apiError } from "./utils/apiError";

const appLogger = new Logger("app");

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
  .use(
    cors({
      origin: "http://localhost:5173",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-eden-request"],
      credentials: true,
    }),
  )
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
    return app
      .use(
        cors({
          origin: "http://localhost:5173",
          methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
          allowedHeaders: ["Content-Type", "Authorization", "x-eden-request"],
          credentials: true,
        }),
      )
      .use(routes);
  });

export default app;

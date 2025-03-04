import { swagger } from "@elysiajs/swagger";
import { Logger } from "common";
import { Elysia } from "elysia";

import cfg from "./config";

import { routes } from "./routes";

const appLogger = new Logger("app");

async function startServer() {
  const app = new Elysia()
    .use(swagger({ path: "/api/docs" }))
    .group("/api", (app) => {
      return app
        .use(routes);
    })
    .listen(cfg.server.port);

  appLogger.info(
    `${cfg.app.fullName} v${cfg.app.version} is running at ${app.server?.hostname}:${app.server?.port}`,
  );
}

startServer();

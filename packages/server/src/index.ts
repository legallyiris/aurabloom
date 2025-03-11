import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { Logger } from "common";
import { Elysia } from "elysia";

import app from "./app";
import cfg from "./config";

import { routes } from "./routes";
import { apiError } from "./utils/apiError";

const appLogger = new Logger("app");

app.listen(cfg.server.port);

appLogger.info(
  `${cfg.app.fullName} v${cfg.app.version} is running at ${app.server?.hostname}:${app.server?.port}`,
);

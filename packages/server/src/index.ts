import { Logger } from "common";
import { Elysia } from "elysia";
import cfg from "./config";

const appLogger = new Logger("app");

const app = new Elysia()
  .get("/", () => `${cfg.app.fullName} v${cfg.app.version}!`)
  .listen(cfg.server.port);

appLogger.info(
  `${cfg.app.fullName} v${cfg.app.version} is running at ${app.server?.hostname}:${app.server?.port}`,
);

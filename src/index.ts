import { Elysia } from "elysia";
import { Logger } from "./utils/logging";

const appLogger = new Logger("app");
const app = new Elysia().get("/", () => "Hello Elysia").listen(3000);

appLogger.info(
  `🌸 aurabloom! is running at ${app.server?.hostname}:${app.server?.port}`,
);

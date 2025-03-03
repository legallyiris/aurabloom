import { Database } from "bun:sqlite";

import { swagger } from "@elysiajs/swagger";
import { Logger } from "common";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { Elysia } from "elysia";

import cfg from "./config";
import db, { schema } from "./db";
import { models } from "./db/models";

const appLogger = new Logger("app");

async function startServer() {
  const app = new Elysia()
    .use(swagger())
    .onError(({ code, error, set }) => {
      set.status = 500;
      appLogger.error("error:", error);
      return {
        status: "error",
        code: 500,
      };
    })
    .post(
      "/users",
      async ({ body }) => {
        const user = await db.insert(schema.users).values(body).returning();
        return {
          status: "success",
          data: user[0],
        };
      },
      {
        body: models.user.create,
      },
    )
    .get("/", () => `${cfg.app.fullName} v${cfg.app.version}!`)
    .listen(cfg.server.port);

  appLogger.info(
    `${cfg.app.fullName} v${cfg.app.version} is running at ${app.server?.hostname}:${app.server?.port}`,
  );
}

startServer();

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
    .post(
      "/users",
      async ({ body }) => {
        const user = await db.insert(schema.users).values(body).returning();
        return user[0];
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

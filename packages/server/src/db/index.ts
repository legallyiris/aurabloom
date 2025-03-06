import { Database } from "bun:sqlite";
import fs from "node:fs";
import { Logger } from "@aurabloom/common";
import { drizzle } from "drizzle-orm/bun-sqlite";

import config from "../config";
import * as schema from "./schema";

function helper(message: string) {
  logger.error(message);
  logger.error("please run the following commands:");
  logger.error("\tbunx drizzle-kit up");
  logger.error("\tbunx drizzle-kit migrate");
  console.log();
  process.exit(1);
}

const logger = new Logger("db");

if (!fs.existsSync(config.db.path))
  helper("database file not found or aurabloom can't access it");

const sqlite = new Database(config.db.path);
const db = drizzle(sqlite, { schema });

const tables = db.all("SELECT name FROM sqlite_master WHERE type='table'");
if (tables.length <= 1) helper("database doesn't contain the expected tables");

export { schema };
export default db;

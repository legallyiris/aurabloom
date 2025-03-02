import { Database } from "bun:sqlite";
import { Logger } from "common";
import { drizzle } from "drizzle-orm/bun-sqlite";

import config from "../config";
import * as schema from "./schema";

const logger = new Logger("db");

const sqlite = new Database(config.db.path, { create: true });
const db = drizzle(sqlite, { schema });
logger.info(`Database file: ${sqlite.filename}`);

export { schema };
export default db;

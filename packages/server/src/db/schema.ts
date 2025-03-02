import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: int().primaryKey({ autoIncrement: true }),
  username: text("username", { length: 48 }).notNull().unique(),
  displayName: text("displayName", { length: 48 }).notNull(),
  password: text("password").notNull(),
});

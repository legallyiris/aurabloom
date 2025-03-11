import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: int().primaryKey({ autoIncrement: true }),
  username: text("username", { length: 48 }).notNull().unique(),
  displayName: text("displayName", { length: 48 }).notNull(),
  aboutMe: text("aboutMe", { length: 500 }),
  password: text("password").notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  expiresAt: int("expiresAt").notNull(),
  createdAt: int("createdAt")
    .notNull()
    .default(Math.floor(Date.now() / 1000)),
  userAgent: text("userAgent"),
  ipAddress: text("ipAddress"),
});
